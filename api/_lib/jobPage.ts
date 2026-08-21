import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const maximumPageBytes = 1_000_000
const maximumPromptCharacters = 30_000
const maximumRedirects = 4

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => (
      String.fromCodePoint(Number.parseInt(code, 16))
    ))
    .replace(/&([a-z]+);/gi, (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity)
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<(?:br|hr)\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:div|h[1-6]|li|p|section|article|tr)>/gi, '\n')
    .replace(/<li(?:\s[^>]*)?>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function findJobPostings(value: unknown, results: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) findJobPostings(item, results)
    return results
  }

  if (typeof value !== 'object' || value === null) return results
  const record = value as Record<string, unknown>
  const type = record['@type']
  const types = Array.isArray(type) ? type : [type]

  if (types.includes('JobPosting')) results.push(record)
  for (const child of Object.values(record)) findJobPostings(child, results)
  return results
}

function schemaText(value: unknown): string {
  if (typeof value === 'string') return stripHtml(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(schemaText).filter(Boolean).join(', ')
  if (typeof value !== 'object' || value === null) return ''

  const record = value as Record<string, unknown>
  return ['name', 'addressLocality', 'addressRegion', 'addressCountry']
    .map((key) => schemaText(record[key]))
    .filter(Boolean)
    .join(', ')
}

function extractStructuredJobData(html: string) {
  const sections: string[] = []
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  for (const match of html.matchAll(scriptPattern)) {
    try {
      const parsed = JSON.parse(match[1] ?? '') as unknown
      for (const posting of findJobPostings(parsed)) {
        const fields = [
          ['Job title', posting.title],
          ['Company', posting.hiringOrganization],
          ['Location', posting.jobLocation],
          ['Employment type', posting.employmentType],
          ['Description', posting.description],
          ['Responsibilities', posting.responsibilities],
          ['Qualifications', posting.qualifications],
          ['Skills', posting.skills],
        ]
          .map(([label, value]) => `${label}: ${schemaText(value)}`)
          .filter((field) => !field.endsWith(': '))

        if (fields.length > 0) sections.push(fields.join('\n'))
      }
    } catch {
      // Ignore malformed structured data and fall back to visible page text.
    }
  }

  return sections.join('\n\n')
}

function extractMetaDescription(html: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []

  for (const tag of metaTags) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)]
        .map((match) => [match[1]?.toLowerCase(), match[2] ?? '']),
    )
    const name = (attributes.name ?? attributes.property ?? '').toLowerCase()
    if (['description', 'og:description'].includes(name) && attributes.content) {
      return stripHtml(attributes.content)
    }
  }

  return ''
}

export function extractJobPageText(html: string) {
  const structuredData = extractStructuredJobData(html)
  const title = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const metaDescription = extractMetaDescription(html)
  const visibleText = stripHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' '),
  )
  const sections = [
    structuredData && `STRUCTURED JOB DATA\n${structuredData}`,
    title && `PAGE TITLE\n${title}`,
    metaDescription && `META DESCRIPTION\n${metaDescription}`,
    visibleText && `VISIBLE PAGE TEXT\n${visibleText}`,
  ].filter(Boolean)
  const pageText = sections.join('\n\n').slice(0, maximumPromptCharacters).trim()

  if (pageText.length < 40) {
    throw new Error('The job page did not contain enough readable content.')
  }

  return pageText
}

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true
  const [first, second] = octets

  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || (first === 198 && second === 51 && octets[2] === 100)
    || (first === 203 && second === 0 && octets[2] === 113)
    || first >= 224
}

export function isPrivateOrReservedAddress(rawAddress: string) {
  const address = rawAddress.toLowerCase().replace(/^\[|\]$/g, '')
  const version = isIP(address)

  if (version === 4) return isPrivateIpv4(address)
  if (version !== 6) return true

  const mappedIpv4 = address.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4)

  return address === '::'
    || address === '::1'
    || address.startsWith('::ffff:')
    || /^f[cd]/.test(address)
    || /^fe[89ab]/.test(address)
    || /^ff/.test(address)
    || /^2001:db8(?::|$)/.test(address)
}

async function validatePublicUrl(rawUrl: string) {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Enter a valid public job listing URL.')
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Enter a valid public job listing URL.')
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    throw new Error('The job listing URL uses an unsupported port.')
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.lan')
  ) {
    throw new Error('The job listing URL must use a public website.')
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedAddress(hostname)) {
      throw new Error('The job listing URL must use a public website.')
    }
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true })
    if (
      addresses.length === 0
      || addresses.some(({ address }) => isPrivateOrReservedAddress(address))
    ) {
      throw new Error('The job listing URL must use a public website.')
    }
  }

  url.hash = ''
  return url
}

async function readLimitedResponse(response: Response) {
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maximumPageBytes) {
    throw new Error('The job listing page is too large to import.')
  }
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let totalBytes = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > maximumPageBytes) {
      await reader.cancel()
      throw new Error('The job listing page is too large to import.')
    }
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

export async function fetchPublicJobPage(rawUrl: string) {
  let currentUrl = await validatePublicUrl(rawUrl)

  for (let redirectCount = 0; redirectCount <= maximumRedirects; redirectCount += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    try {
      const response = await fetch(currentUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
          'User-Agent': 'JobApplicationAssistant/1.0 (+public job import)',
        },
        redirect: 'manual',
        signal: controller.signal,
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        await response.body?.cancel()
        if (!location || redirectCount === maximumRedirects) {
          throw new Error('The job listing redirected too many times.')
        }
        currentUrl = await validatePublicUrl(new URL(location, currentUrl).href)
        continue
      }

      if (!response.ok) {
        throw new Error(`The job listing returned status ${response.status}.`)
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      if (
        contentType
        && !contentType.includes('text/html')
        && !contentType.includes('application/xhtml+xml')
        && !contentType.includes('text/plain')
      ) {
        throw new Error('The URL did not return a readable job listing page.')
      }

      return extractJobPageText(await readLimitedResponse(response))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('The job listing could not be imported.')
}
