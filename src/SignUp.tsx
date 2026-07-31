import {NavBanner} from "./components/NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import {FormEvent} from "react";

export default function SignUp() {
  const navigate = useNavigate();

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("signing up");

    const response = await fetch("http://127.0.0.1:8000/api/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: e.target.username.value,
        email: e.target.email.value,
        password: e.target.password.value
      })
    });

    if (response.ok) {
      navigate("/sign-in");
    }
  }

  return (
    <>
      <NavBanner />
      <Container className={"m-5"}>
        <Row>
          <h1>Sign Up</h1>
        </Row>
        <Form onSubmit={handleSignUp}>
         <Row>
            <Form.Group as={Col} xs={12} md={6} className="my-3" controlId="formBasicEmail">
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

           <Form.Group as={Col} xs={12} md={6} className="my-3" controlId="formBasicEmail">
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

            <Form.Group as={Col} sm={12} md={6} className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                  type="password"
                  placeholder="Password"
                  name="password"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
              <Form.Check type="checkbox" label="Check me out" />
            </Form.Group>
            <Button variant="primary" type={"submit"}>
              Sign Up
            </Button>
          </Row>
        </Form>
</Container>
    </>
  )
}