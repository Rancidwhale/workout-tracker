import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

import { PRList } from '../components/PRList'
import { StreakCard } from '../components/StreakCard'
import { buttonClass } from '../components/buttonClass'
import { Card, PageHeader, Spinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

// Recharts is the bulk of the bundle; load it only when the dashboard renders.
const VolumeChart = lazy(() => import('../components/VolumeChart').then((m) => ({ default: m.VolumeChart })))

export function DashboardPage() {
  const { user } = useAuth()
  const name = user?.display_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={name ? `Hi, ${name}` : 'Dashboard'}
        subtitle="Your training at a glance"
        actions={
          <Link to="/workouts/new" className={buttonClass('primary')}>
            + Log workout
          </Link>
        }
      />
      <div className="space-y-4">
        <StreakCard />
        <Suspense
          fallback={
            <Card className="flex h-80 items-center justify-center">
              <Spinner />
            </Card>
          }
        >
          <VolumeChart />
        </Suspense>
        <PRList />
      </div>
    </>
  )
}
