import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';


// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {

    let [username, setUserName] = React.useState("");
    let [name, setName] = React.useState("");
    let [password, setPassword] = React.useState("");
    let [formState, setFormState] = React.useState(0); // Means signin if 1 means signup
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");
    let [open, setOpen] = React.useState(false);

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    sx={{
                        width: { xs: '0px', sm: '300px', md: '500px' }, // Fixed width
                        backgroundImage:
                            'url("/static/images/templates/templates-images/sign-in-side-bg.png")',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'left',
                        display: { xs: 'none', sm: 'block' }, // Hide on extra-small screens
                    }}
                />
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
                            <Button variant={formState === 0 ? "contained" : ""} onClick={() => {setFormState(0); setName(""); setUserName(""); setPassword("");}}>
                                Signin
                            </Button>
                            <Button variant={formState === 1 ? "contained" : ""} onClick={() => {setFormState(1); setName(""); setUserName(""); setPassword("");}}>
                                Signup
                            </Button>
                        </div>

                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            {
                                formState == 1 ?
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="fullname"
                                        label="Full Name"
                                        name="fullname"
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                        value={name}
                                    />
                                    : <></>
                            }
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