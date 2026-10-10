import { Link, Route, Routes } from 'react-router-dom'

import { LoginForm, SignupForm } from './components/AuthForms'
import { Layout } from './components/Layout'
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute'
import { EmptyState } from './components/ui'
import { DashboardPage } from './pages/DashboardPage'
import { WorkoutDetailPage } from './pages/WorkoutDetailPage'
import { EditWorkoutPage, NewWorkoutPage } from './pages/WorkoutEditorPages'
import { WorkoutsPage } from './pages/WorkoutsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="workouts/new" element={<NewWorkoutPage />} />
          <Route path="workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="workouts/:id/edit" element={<EditWorkoutPage />} />
          <Route
            path="*"
            element={
              <EmptyState title="Page not found">
                <Link to="/" className="font-medium text-accent hover:underline">
                  Go to the dashboard
                </Link>
              </EmptyState>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}
