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
import {api, getUserProfile, signOutUser} from "../../model/cloud-storage";
import snakeLogo from './snake_logo.svg';

export default function VerifyUser() {
    const navigate = useNavigate();

    const backendUrl = envVarOrFail("BACKEND_URL");

    const setUsername = useStoreActions(
        (actions) => actions.cloudUser.setUsername
    );

    const setEmail = useStoreActions(
        (actions) => actions.cloudUser.setEmail
    );

    const [verificationSuccess, setVerificationSuccess] = useState(false)

    const [verificationError, setVerificationError] = useState<boolean>(false);

    async function handleVerify(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("verifying user");

        let formData = new FormData();
        formData.append('verification_code', e.target.verificationcode.value);

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

        const body = JSON.stringify({
            code: e.target.verificationcode.value
        })

        const res = await api(`${backendUrl}/api/verify-user`, {
            method: "POST",
            body: body,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("unverified_user_access_token")}`,
                'Content-Type': 'application/json'
            },
        } as RequestInit);

        if (res.ok) {
            const json = res.json();
            localStorage.setItem("access_token", json.access_token);
            localStorage.setItem("refresh_token", json.refresh_token);
            // fetchUser();
            setVerificationSuccess(true)
        }
        else {
            console.error("Could not verify user");
            setVerificationError(true);
        }
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
                {verificationSuccess ?
                        <Row>
                            <h1 className={"text-center mb-4"}>Verification Success</h1>
                            <Col className={"d-flex"}>
                                <img src={snakeLogo as string} alt={"Pytch Snake logo"} style={{width: 250}} className={"mx-auto"}/>
                            </Col>
                            <Button>Back to h</Button>
                        </Row>
                        :
                    <>
                        <Row>
                            <h1 className={"text-center mb-4"}>Verify your Account</h1>
                        </Row>
                        {
                            verificationError ?
                                (
                                    <Alert key={"danger"} variant={"danger"}>
                                        Could not verify user.
                                    </Alert>
                                )
                                : undefined
                        }

                        <Row className={"mt-3"}>
                            <Col className={"ps-0"}>
                                <Form onSubmit={handleVerify} className={"sign-in"}>
                                    <Row>
                                        <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                                            <Form.Label>Verification code</Form.Label>
                                            <Form.Control
                                                required
                                                type="text"
                                                placeholder="Enter your verification code"
                                                name="verificationcode"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please submit a username or email address.
                                            </Form.Control.Feedback>
                                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                                        </Form.Group>
                                        <Button variant="primary" type={"submit"}>
                                            Verify
                                        </Button>
                                    </Row>
                                </Form>
                            </Col>
                        </Row>
                    </>
                }

            </Container>
        </>
    )
}