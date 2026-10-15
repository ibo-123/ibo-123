import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { contestApi } from '../services/contestApi'
import { tournamentApi } from '../services/tournamentApi'
import type { Result } from '../types'

export const Results = () => {
  const { contestId } = useParams<{ contestId: string }>()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contestId) return
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (!t) throw new Error('No tournament found')
        return contestApi.results(t._id, contestId)
      })
      .then(({ results: rows }) => setResults(rows))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [contestId])

  if (loading) return <LoadingState label="Loading contest results..." />
  if (error) return <ErrorState error={error} />

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <div style={{ marginBottom: 16 }}>
          <Link to="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sub)' }}>
            <ArrowLeft size={16} /> Back to Standings
          </Link>
        </div>

        <header className="page-heading">
          <div>
            <small>OFFICIAL CONTEST RESULTS</small>
            <h1>Contest Submissions & Scores</h1>
          </div>
        </header>

        <Card className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Participant</th>
                  <th>Codeforces Handle</th>
                  <th>Group</th>
                  <th>Solved</th>
                  <th>Score</th>
                  <th>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {results.length ? (
                  results.map((res) => (
                    <tr key={res._id}>
                      <td>#{res.rank}</td>
                      <td><strong>{res.participant?.user?.username || res.participant?.user?.name || '—'}</strong></td>
                      <td><small>{res.participant?.user?.codeforcesUsername || '—'}</small></td>
                      <td>{res.participant?.group || '—'}</td>
                      <td>{res.solved}</td>
                      <td className="purple">{res.score}</td>
                      <td>{res.penalty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState label="No result records found for this contest." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  )
}

export default Results
