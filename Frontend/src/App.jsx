import React from 'react'
import {createBrowserRouter , RouterProvider} from 'react-router-dom';
import Landing_Page from './pages/Landing_Page';
import Authentication from './pages/Authentication';
import HomePage from './pages/HomePage';
import VideoMeet from './pages/VideoMeet';
import History from './pages/History';

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
  },
  {
    path : "/history",
    element : <History/>
  },
  {
    path : "/:url",
    element : <VideoMeet/>
  },
])

export default function App() {
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}
