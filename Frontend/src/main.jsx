import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from "react-redux"
import { Toaster } from 'react-hot-toast'
import store from './redux/store.js'

createRoot(document.getElementById('root')).render(
  <>
    <>
      <Provider store={store}>
        <App />
        <Toaster position="top-left" reverseOrder={false} />
      </Provider>

    </>
  </>
)
