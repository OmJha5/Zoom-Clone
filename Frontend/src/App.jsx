import React from 'react'
import {createBrowserRouter , RouterProvider} from 'react-router-dom';
import Landing_Page from './pages/Landing_Page';

let appRouter = createBrowserRouter([
  {
    path : "/",
    element : <Landing_Page/>
  }
])

export default function App() {
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}
