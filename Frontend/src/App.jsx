import React from 'react'
import {createBrowserRouter , RouterProvider} from 'react-router-dom';
import Landing_Page from './pages/Landing_Page';
import Authentication from './pages/Authentication';
import HomePage from './pages/HomePage';

let appRouter = createBrowserRouter([
  {
    path : "/",
    element : <Landing_Page/>
  },
  {
    path : "/auth",
    element : <Authentication/>
  },
  {
    path : "/home",
    element : <HomePage/>
  }
])

export default function App() {
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}
