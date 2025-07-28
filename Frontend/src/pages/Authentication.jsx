import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {USER_ENDPOINT_API} from '../utils/apiEndPoint';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setSliceName , setSliceUserName } from '../redux/authSlice.js';


const defaultTheme = createTheme();

export default function Authentication() {
    let navigate = useNavigate();
    let dispatch = useDispatch();

    let [username, setUserName] = React.useState("");
    let [name, setName] = React.useState("");
    let [password, setPassword] = React.useState("");
    let [formState, setFormState] = React.useState(0); // Means signin if 1 means signup

    let isFormValid = () => {
        return username != "" && password != "";
    }

    let signinHandler = async () => {
        if (isFormValid()) {
            try {
                let res = await axios.post(`${USER_ENDPOINT_API}/login`, { username , password }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    withCredentials: true
                })

                if(res.data.success){
                    dispatch(setSliceName(res.data.user.name));
                    dispatch(setSliceUserName(res.data.user.username));
                    navigate("/home");
                    toast.success("Signin successful");
                }
            }
            catch (e) {
                toast.error(e?.response?.data?.message || "Signin failed");
            }
        }
        else{
            toast.error("Fields are required")
        }
    }

    let signupHandler = async () => {
        if (isFormValid()) {
            try {
                let res = await axios.post(`${USER_ENDPOINT_API}/register`, { username, name, password }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    withCredentials: true
                })

                if(res.data.success){
                    dispatch(setSliceName(res.data.user.name));
                    dispatch(setSliceUserName(res.data.user.username));
                    navigate("/home");
                    toast.success("Signup successful");
                }
            }
            catch (e) {
                toast.error(e?.response?.data?.message || "Signup failed");
            }
        }
        else{
            toast.error("Fields are required")
        }
    }

    let handleSubmit = async (e) => {
        e.preventDefault();
        if (formState == 0) {
            await signinHandler();
        }
        else await signupHandler();
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />


                {/* This grid refers to the form section */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <div>
                            <Button variant={formState === 0 ? "contained" : ""} onClick={() => { setFormState(0); setName(""); setUserName(""); setPassword(""); }}>
                                Signin
                            </Button>
                            <Button variant={formState === 1 ? "contained" : ""} onClick={() => { setFormState(1); setName(""); setUserName(""); setPassword(""); }}>
                                Signup
                            </Button>
                        </div>

                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="fullname"
                                label="Full Name"
                                name="fullname"
                                autoFocus={formState === 1}
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                sx={{ display: formState === 1 ? 'block' : 'none' }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoFocus
                                onChange={(e) => setUserName(e.target.value)}
                                value={username}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                            <FormControlLabel
                                control={<Checkbox value="remember" color="primary" />}
                                label="Remember me"
                            />
                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleSubmit}
                            >
                                {formState === 0 ? "Signin" : "Signup"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </ThemeProvider>
    );
}