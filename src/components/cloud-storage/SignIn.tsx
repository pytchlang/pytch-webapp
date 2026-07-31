import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import {FormEvent, useState} from "react";
import {envVarOrFail} from "../../env-utils";
import {useStoreActions} from "../../store";
import Alert from "react-bootstrap/Alert";

export default function SignUp() {
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
        formData.append('username', e.target.username.value);
        formData.append('email', e.target.email.value);
        formData.append('password', e.target.password.value);

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
            sessionStorage.setItem("token", json.access_token);
            setUsername(e.target.username.value);
            setEmail(e.target.email.value);
            navigate("/profile");
        })
        .catch(err => {
            console.error(err);
            setSignInError(true);
        })
    }

    return (
        <>
            <NavBanner />
            <Container className={"m-5"}>
                <Row>
                    <h1>Sign In</h1>
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
                <Form onSubmit={handleSignIn}>
                    <Row>
                        <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                required
                                type="username"
                                placeholder="Enter username"
                                name="username"
                            />
                            <Form.Control.Feedback type="invalid">
                                Please submit a username.
                            </Form.Control.Feedback>
                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
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
                        </Form.Group>

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
            </Container>
        </>
    )
}