import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { tournamentApi } from '../services/tournamentApi'
import type { Bracket, Participant } from '../types'

export const Champion = () => {
  const [champion, setChampion] = useState<Participant | null>(null)
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (!t) throw new Error('No active tournament')
        return tournamentApi.bracket(t._id)
      })
      .then(({ bracket: data }) => {
        setBracket(data)
        setChampion(data.champion || null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Retrieving champion record..." />
  if (error) return <ErrorState error={error} />

  const finalMatch = bracket?.final

  return (
    <>
      <Navbar />
      <main className="champion-page page">
        <small>CODE ARENA 2026</small>
        <div className="crown">
          <Crown size={72} color="#FFD700" />
        </div>
        <Badge tone="gold">GRAND CHAMPION</Badge>
        <h1>{champion?.user.username || champion?.user.name || 'Tournament In Progress'}</h1>
        <p style={{ color: 'var(--sub)', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>
          {champion
            ? `Crowned Champion of Code Arena 2026. Representing handle @${champion.user.codeforcesUsername}.`
            : 'The championship crown has not yet been awarded. Follow the finals in the bracket.'}
        </p>

        {finalMatch && (
          <Card style={{ maxWidth: 600, margin: '40px auto 0', padding: 32 }}>
            <small>GRAND FINAL MATCHUP</small>
            <div className="final-line">
              {finalMatch.participants.map((p) => (
                <div key={p._id} style={{ color: p._id === champion?._id ? 'var(--gold)' : 'inherit' }}>
                  {p.user.username}
                </div>
              ))}
            </div>
            <Badge tone={finalMatch.status === 'COMPLETED' ? 'green' : 'red'}>
              {finalMatch.status || 'PENDING'}
            </Badge>
          </Card>
        )}
      </main>
    </>
  )
}

export default Champion
