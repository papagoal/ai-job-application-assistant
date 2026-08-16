import { useParams } from 'react-router-dom'

function AnalysisResultPage() {
  const { id } = useParams()

  return <h1>Analysis Result: {id}</h1>
}

export default AnalysisResultPage
