import React, { useEffect } from 'react'
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import useCheckUser from '../hooks/useCheckUser';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

export default function Landing_Page() {
  let navigate = useNavigate();
  useCheckUser();

  let id = useSelector((state) => state.auth.id);

  let registerHandler = () => {
    navigate("/auth" , {
        state : {
          formState : 1
        }
    })
  }

  let loginHandler = () => {
    navigate("/auth" , {
        state : {
          formState : 0
        }
    })
  }

  let guestHandler = () => {
    const id = nanoid(10); // Give unique string of 10 characters . nanoid is a library for this
    navigate(`/${id}`)
  }

  let getStartedClickHandler = (e) => {
    if(id == null){
      // that means user logged in nhi hai aur get started pe click karne ki koshish kar raha hai to yeh to galat hai 
      toast.error("Please login to continue or Join as guest")
      e.preventDefault(); // yeh link ke navigation ko rok dega
    }
    else{
      navigate("/home");
    }
  }

  return (
    <div className='landingPageContainer'>
      <nav>
        <div className="navHeader">
          <h2>
            <Link style={{ textDecoration: "none", color: "white" }} to={"/"}>Zoom Video Call</Link>
          </h2>
        </div>
        <div className="navList">
          <ul>
            {
              id == null && <li onClick={guestHandler}>Join As Guest</li> // that means agar user logged in nhi hai tabhi yeh show karo
            }
            <li>
              <div onClick={registerHandler} role="button">
                <p>Register</p>
              </div>
            </li>
            <li>
              <div onClick={loginHandler} role="button">
                <p>Login</p>
              </div>
            </li>
          </ul>

        </div>
      </nav>

      <main className="landingPageMainContainer">
        <div>
          <h1><span style={{ color: "#FF9839" }}>Connect</span> with your old ones</h1>
          <p className='mainP'>Join a video call with your friends and family, no matter where they are.</p>

          <div role="button">
            {/* when you apply click handler to Link to then pehle onClick chalta hai and agar usne preventDefault kardiya then navigation ruk jaata hai  */}
            <Link to={"/home"} onClick={getStartedClickHandler}>Get Started</Link> 
          </div>
        </div>

        <div>
          <img src="images/mobile.png" alt="" />
        </div>
      </main>
    </div>
  )
}
