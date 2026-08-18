import type { User } from '@supabase/supabase-js'
import type { ApplicationStatus, SavedApplication } from '../types/application'
import type { JobAnalysis } from '../types/jobAnalysis'
import type { JobDescriptionInput } from '../types/jobApplication'
import type { Profile } from '../types/profile'
import {
  deleteApplication as deleteLocalApplication,
  getApplication as getLocalApplication,
  getApplications as getLocalApplications,
  getProfile as getLocalProfile,
  saveApplication as saveLocalApplication,
  saveProfile as saveLocalProfile,
  updateApplicationCoverLetter as updateLocalApplicationCoverLetter,
  updateApplicationStatus as updateLocalApplicationStatus,
} from './localStorageService'
import { isSupabaseConfigured, supabase } from './supabaseClient'

interface ApplicationRow {
  id: string
  company_name: string
  job_title: string
  match_score: number
  status: SavedApplication['status']
  created_at: string
  analysis: JobAnalysis
  job_description: string
  resume_text: string
}

async function getCloudUser(): Promise<User | null> {
  if (!supabase) return null

  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user) return sessionData.session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}

function fromApplicationRow(row: ApplicationRow): SavedApplication {
  return {
    id: row.id,
    companyName: row.company_name,
    jobTitle: row.job_title,
    matchScore: row.match_score,
    status: row.status,
    createdAt: new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(row.created_at)),
    analysis: row.analysis,
    jobDescription: row.job_description,
    resumeText: row.resume_text,
  }
}

function toApplicationRow(application: SavedApplication, userId: string) {
  return {
    id: application.id,
    user_id: userId,
    company_name: application.companyName,
    job_title: application.jobTitle,
    match_score: application.matchScore,
    status: application.status,
    analysis: application.analysis,
    job_description: application.jobDescription,
    resume_text: application.resumeText,
  }
}

async function migrateLocalData(user: User): Promise<void> {
  if (!supabase) return
  const migrationKey = `job-assistant.cloud-migrated.${user.id}.v1`
  if (localStorage.getItem(migrationKey)) return

  const profile = getLocalProfile()
  const applications = getLocalApplications()

  if (profile) {
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      full_name: profile.fullName,
      email: profile.email,
      professional_summary: profile.professionalSummary,
      resume_text: profile.resumeText,
    }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (error) throw error
  }

  if (applications.length > 0) {
    const { error } = await supabase
      .from('applications')
      .upsert(applications.map((application) => toApplicationRow(application, user.id)), {
        onConflict: 'id',
        ignoreDuplicates: true,
      })
    if (error) throw error
  }

  localStorage.setItem(migrationKey, 'true')
}

async function getReadyCloudUser(): Promise<User | null> {
  const user = await getCloudUser()
  if (user) await migrateLocalData(user)
  return user
}

export { isSupabaseConfigured }

export async function getProfile(): Promise<Profile | null> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) return getLocalProfile()

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,email,professional_summary,resume_text')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    fullName: data.full_name,
    email: data.email,
    professionalSummary: data.professional_summary,
    resumeText: data.resume_text,
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) {
    saveLocalProfile(profile)
    return
  }

  const { error } = await supabase.from('profiles').upsert({
    user_id: user.id,
    full_name: profile.fullName,
    email: profile.email,
    professional_summary: profile.professionalSummary,
    resume_text: profile.resumeText,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function getApplications(): Promise<SavedApplication[]> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) return getLocalApplications()

  const { data, error } = await supabase
    .from('applications')
    .select('id,company_name,job_title,match_score,status,created_at,analysis,job_description,resume_text')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ApplicationRow[]).map(fromApplicationRow)
}

export async function getApplication(id: string): Promise<SavedApplication | undefined> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) return getLocalApplication(id)

  const { data, error } = await supabase
    .from('applications')
    .select('id,company_name,job_title,match_score,status,created_at,analysis,job_description,resume_text')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? fromApplicationRow(data as ApplicationRow) : undefined
}

export async function saveApplication(
  input: JobDescriptionInput,
  analysis: JobAnalysis,
): Promise<SavedApplication> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) return saveLocalApplication(input, analysis)

  const application: SavedApplication = {
    id: crypto.randomUUID(),
    companyName: analysis.companyName,
    jobTitle: analysis.jobTitle,
    matchScore: analysis.matchScore,
    status: 'Draft',
    createdAt: new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date()),
    analysis,
    jobDescription: input.jobDescription,
    resumeText: input.resumeText,
  }

  const { error } = await supabase
    .from('applications')
    .insert(toApplicationRow(application, user.id))
  if (error) throw error
  return application
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) {
    updateLocalApplicationStatus(id, status)
    return
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Application not found.')
}

export async function updateApplicationCoverLetter(
  id: string,
  coverLetter: string,
): Promise<void> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) {
    updateLocalApplicationCoverLetter(id, coverLetter)
    return
  }

  const { data: application, error: loadError } = await supabase
    .from('applications')
    .select('analysis')
    .eq('id', id)
    .maybeSingle()
  if (loadError) throw loadError
  if (!application) throw new Error('Application not found.')

  const { data, error } = await supabase
    .from('applications')
    .update({
      analysis: {
        ...(application.analysis as JobAnalysis),
        coverLetter,
      },
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Application not found.')
}

export async function deleteApplication(id: string): Promise<void> {
  const user = await getReadyCloudUser()
  if (!supabase || !user) {
    deleteLocalApplication(id)
    return
  }

  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Application not found.')
}
