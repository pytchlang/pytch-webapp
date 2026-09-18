import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import {CSSProperties, FormEvent, useState} from "react";
import {envVarOrFail} from "../../env-utils";
import {useStoreActions} from "../../store";
import Alert from "react-bootstrap/Alert";
import "./pytch-cloud.scss";
import {welcomeAssetUrl} from "../front-page/utils";
import {getUserProfile, signOutUser} from "../../model/cloud-storage";

export default function SignIn() {
    const navigate = useNavigate();

    const backendUrl = envVarOrFail("BACKEND_URL");

    const setUsername = useStoreActions(
        (actions) => actions.cloudUser.setUsername
    );

    const setEmail = useStoreActions(
        (actions) => actions.cloudUser.setEmail
    );

    const [signInError, setSignInError] = useState<boolean>(false);

    async function handleSignIn(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("signing in");

        let formData = new FormData();
        formData.append('username', e.target.usernameoremail.value);
        formData.append('email', e.target.usernameoremail.value);
        formData.append('password', e.target.password.value);

        async function fetchUser() {
            try
            {
                const data = await getUserProfile();
                setUsername(data.username);
                setEmail(data.email);
            }
            catch(err) {
                console.error(err);
                signOutUser();
                navigate("/");
            }
        }

        fetch(`${backendUrl}/api/sign-in`, {
            method: "POST",
            body: formData
        } as RequestInit)
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            else {
                throw new Error("Could not sign in");
            }
        })
        .then(json => {
            sessionStorage.setItem("access_token", json.access_token);
            sessionStorage.setItem("refresh_token", json.refresh_token);
            fetchUser();
            navigate("/profile");
        })
        .catch(err => {
            console.error(err);
            setSignInError(true);
        })
    }

    // Supply background-image here to ensure correct behaviour if app
    // entered via non-root route.
    const contentStyle: CSSProperties = {
        backgroundImage: `url(${welcomeAssetUrl("two-students-using-Pytch.jpg")})`,
        height: "100%",
        backgroundSize: "cover",
    };

    return (
        <>
            <NavBanner />
            <Container className={"m-5 mx-auto"}>
                <Row>
                    <h1 className={"text-center mb-4"}>Sign In</h1>
                </Row>
                {
                    signInError ?
                        (
                            <Alert key={"danger"} variant={"danger"}>
                                Could not sign into account.
                            </Alert>
                        )
                        : undefined
                }
                <Row className={"mt-3"}>
                    <Col className={"pe-0"}>
                        <div className={"filter"} style={contentStyle}/>
                    </Col>
                    <Col className={"ps-0"}>
                        <Form onSubmit={handleSignIn} className={"sign-in"}>
                            <Row>
                                <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                                    <Form.Label>Email or username</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter email or username"
                                        name="usernameoremail"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please submit a username or email address.
                                    </Form.Control.Feedback>
                                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                </Form.Group>

                                {/*<Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control
                                        required
                                        type="email"
                                        placeholder="Enter email"
                                        name="email"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please submit an email address.
                                    </Form.Control.Feedback>
                                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                </Form.Group>*/}

                                <Form.Group as={Col} sm={12} className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        name="password"
                                    />
                                </Form.Group>
                                <Button variant="primary" type={"submit"}>
                                    Sign In
                                </Button>
                            </Row>
                            <Row>
                                <Link to={"/sign-up"}>Create a new account</Link>
                            </Row>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    )
}