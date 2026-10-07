import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Tooltip} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import {CSSProperties, FormEvent, useState} from "react";
import Alert from "react-bootstrap/esm/Alert";
import "./pytch-cloud.scss";
import {welcomeAssetUrl} from "../front-page/utils";
import {parseRole} from "../../model/cloud-storage";

export default function SignUp() {
  const navigate = useNavigate();

  const [signUpError, setSignUpError] = useState<boolean>(false);

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("signing up");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: e.target.username.value,
          email: e.target.email.value,
          password: e.target.password.value,
          role: parseRole(e.target.role.value)
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("sign up response", data);
        localStorage.setItem("unverified_user_access_token", data.data.access_token)
        localStorage.setItem("unverified_user_refresh_token", data.data.refresh_token)
        navigate("/verify-user");
      }
      else {
        throw new Error(`Could not sign up: ${response}`);
      }
    }
    catch (err) {
      console.error(err);
      setSignUpError(true);
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
      <Container className={"m-5 mx-auto sign-up-container"}>
        <Row>
          <h1 className={"text-center mb-4"}>Sign up to Pytch</h1>
        </Row>
        {
          signUpError ?
              (
                  <Alert key={"danger"} variant={"danger"}>
                    Could not create account.
                  </Alert>
              )
              : undefined
        }
        <Row className={"mt-3"}>
          <Col className={"pe-0"}>
            <div className={"filter"} style={contentStyle}/>
          </Col>
          <Col className={"ps-0"}>
            <Form onSubmit={handleSignUp} className={"sign-up"}>
              <Row>
                <Form.Group as={Col} xs={12} className="my-1" controlId="formBasicEmail">
                  <Form.Label>User role</Form.Label>
                  <Form.Select as={Col} name="role" aria-label="Default select example">
                    <option value="user">User</option>
                    <option value="educator">Educator</option>
                    <option value="student">Student</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                  <Form.Label>Birthdate</Form.Label>
                  <Form.Control
                      required
                      type="date"
                      placeholder="Enter username"
                      name="birthdate"
                  />
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
                  <Form.Text className="text-muted">
                    We'll never share your email with anyone else.
                  </Form.Text>
                </Form.Group>
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

                <Form.Group as={Col} xs={12} className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                      type="password"
                      placeholder="Password"
                      name="password"
                  />
                </Form.Group>
                <Form.Check
                    id={`checkbox`}
                    label={`I confirm that I have read the Terms and Conditions as well as the privacy policy and that a legal guardian was present during this registration.`}
                />
                <Button variant="primary" type={"submit"}>
                  Sign Up
                </Button>
              </Row>
            </Form>
          </Col>
        </Row>
</Container>
    </>
  )
}