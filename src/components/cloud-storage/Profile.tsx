import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Spinner} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import React, {FormEvent, useEffect, useRef, useState} from "react";
import {PytchProgramKind} from "../../model/pytch-program-types";
import Card from "react-bootstrap/Card";
import {api, getCurrentUserProjects, getUserProfile, refreshAccessToken, signOutUser} from "../../model/cloud-storage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDownload} from "@fortawesome/free-solid-svg-icons";
import {useStoreActions, useStoreState} from "../../store";
import {cloudProjectFromId} from "../../storage/zipfile";
import {useTranslation} from "react-i18next";
import CloudSidemenu from "./CloudSidemenu";

class ProjectDto {
    id: string;
    program_kind: PytchProgramKind | undefined;
    created_at: string;
    updated_at: string;
    archived: boolean;

}

export default function Profile() {
    const [userProfile, setUserProfile] = useState(undefined);
    const [userProjects, setUserProjects] = useState(undefined);
    const fileRef = useRef(null);

    function handleUploadProject(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("files", fileRef.current.files);
        const file = fileRef.current.files[0];
        console.log("project-title", e.target["project-title"].value);
        const title = e.target["project-title"].value;
        console.log("program-kind", e.target["program-kind"].value);
        const program_kind = e.target["program-kind"].value;

        const body = JSON.stringify({
            title: title,
            program_kind: program_kind.toUpperCase(),
            status: "LISTED",
            archived: false
        })

        const formdata = new FormData();
        formdata.append("uploaded", file);

        api(`projects`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
                'Content-Type': 'application/json'
            },
            body: body
        })
        .then(res => res.json())
        .then(data => {
            console.log("dataa", data.data);
            api(`projects/${data.data.id}/upload`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
                },
                body: formdata
            } as RequestInit).then(data => {
                getUserProjects();
            })
        })
        .catch(err => {
            console.log(err);
        });
    }

    function handleDownloadProject(project: ProjectDto) {
        console.log("download project");

        api(`projects/${project.id}/download`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
            }
        })
            .then(res => {
                if (res.ok) {
                    return res.blob();
                }
                else {
                    throw new Error("Could not get user profile data");
                }
            })
            .then(blob => {
                console.log("project zip", blob);
                const url = window.URL.createObjectURL(blob);
                window.location.assign(url);

                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                    'download',
                    `${project.title}.zip`,
                );

                // Append to html link element page
                document.body.appendChild(link);

                // Start download
                link.click();

                // Clean up and remove the link
                link.parentNode.removeChild(link);
            })
            .catch(err => {
                console.error(err);
                setUserProfile(null);
            })  }

    async function getUserProjects() {
        const data = await getCurrentUserProjects();
        console.log('user projects', data.data)
        try {
            setUserProjects(data.data);
        } catch (err) {
            console.error(err);
            if (err.status == 401) {
                setUserProfile(null);
                navigate("/");
            }
        }
    }

    async function fetchUser() {
        try
        {
            const data = await getUserProfile();
            console.log("user profile", data);
            setUserProfile(data);
            getUserProjects();
        }
        catch(err) {
            console.error(err);
            if (err.status == 401) {
                setUserProfile(null);
                setUserProjects(null);
                signOutUser();
                navigate("/");
            }

        }
    }

    const createProject = useStoreActions(
        (actions) => actions.demoFromZipfileURL.createProject
    );

    const boot = useStoreActions((actions) => actions.demoFromZipfileURL.boot);

    function handleOpenProject(p: ProjectDto) {
        const cloudProjectUrl = cloudProjectFromId(p.id);
        boot(cloudProjectUrl);
    }

    async function handleDeleteProject(p: ProjectDto) {
        await api(`projects/${p.id}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
            }
        })

        getUserProjects()
    }

    const navigate = useNavigate();
    const demoState = useStoreState((state) => state.demoFromZipfileURL.state);
    const { t } = useTranslation("tutorials");

    useEffect(() => {
        fetchUser()

    }, [])

    useEffect(() => {
        switch (demoState.state) {
            case "proposing":
            case "creating":
                createProject();
        }
    }, [demoState.state]);

    return (
        <>
            <NavBanner />

            <Container className={"mx-auto mt-5"}>
                <Row>
                    <Col xs={2}>
                        <CloudSidemenu/>
                    </Col>

                    <Col>
                        <Container>
                            <Row>
                                <Col xs={12}>
                                    {
                                        userProfile === undefined ?
                                            (
                                                <Spinner/>
                                            )
                                            :
                                            userProfile === null ?
                                                (
                                                    <h1>Profile</h1>
                                                )
                                                :
                                                (
                                                    <h1>{userProfile.username}</h1>
                                                )
                                    }
                                    {
                                        userProfile === undefined ?
                                            (
                                                <Spinner/>
                                            )
                                            :
                                            userProfile === null ?
                                                (
                                                    <p>Could not load profile.</p>
                                                )
                                                :
                                                (
                                                    <div className={"bg-white p-3 rounded-3 mb-4"}>
                                                        {userProfile.email ? (<p>E-Mail: {userProfile.email}</p>) : undefined}
                                                        <p>Created at: {new Date(userProfile.created_at).toUTCString()}</p>
                                                    </div>
                                                )
                                    }
                                </Col>
                                <Col>
                                    <h2>Listed Projects {userProjects !== undefined && userProjects !== null && userProjects.length > 0 ? <span style={{fontSize: 16}}>{userProjects.length}</span> : undefined}</h2>
                                    {
                                        userProjects === undefined ?
                                            (
                                                <Spinner/>
                                            )
                                            :
                                            userProjects === null ?
                                                (
                                                    <p>Could not load user projects.</p>
                                                )
                                                :
                                                userProjects.length > 0 ?
                                                    (
                                                        <Container>
                                                            <Row>
                                                                {
                                                                    userProjects.map(
                                                                        (p: ProjectDto) => {
                                                                            return (
                                                                                <Col xs={6} className={"mt-2"}>
                                                                                    <Card className={"cloud-project-card"}>
                                                                                        <Card.Header>
                                                                                            <h3>{p.title}</h3>
                                                                                            <Button onClick={() => handleDeleteProject(p)}>Delete</Button>
                                                                                        </Card.Header>
                                                                                        <Card.Body>
                                                                                            <p>{p.program_kind}</p>
                                                                                            <p>Created at: {new Date(p.created_at).toUTCString()}</p>
                                                                                            <p>Updated at: {new Date(p.updated_at).toUTCString()}</p>
                                                                                            <p>{p.status}</p>
                                                                                            <p>{p.archived}</p>

                                                                                        </Card.Body>
                                                                                        <Card.Footer>
                                                                                            <Button onClick={() => handleOpenProject(p)}>{
                                                                                                demoState.state === "booting"
                                                                                                || demoState.state === "idle"
                                                                                                    ? "Open" : (<Spinner/>)
                                                                                            }</Button>
                                                                                            <Button onClick={() => handleDownloadProject(p)}><FontAwesomeIcon icon={faDownload}/>Download</Button>
                                                                                        </Card.Footer>
                                                                                    </Card>
                                                                                </Col>
                                                                            )}
                                                                    )
                                                                }
                                                            </Row>
                                                        </Container>
                                                    )
                                                    :
                                                    (
                                                        <p>No projects found.</p>
                                                    )
                                    }
                                    <h3>Upload</h3>
                                    <Form onSubmit={handleUploadProject}>
                                        <Row>
                                            <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                                                <Form.Label>Project Title</Form.Label>
                                                <Form.Control
                                                    required
                                                    type="project-title"
                                                    placeholder="Enter project title"
                                                    name="project-title"
                                                />
                                            </Form.Group>

                                            <Form.Group as={Col} xs={12} className="my-3" controlId="formBasicEmail">
                                                <Form.Label>Program Kind</Form.Label>
                                                <Form.Select
                                                    required
                                                    type="program-kind"
                                                    name="program-kind"
                                                >
                                                    <option>Enter program kind</option>
                                                    <option value="FLAT">flat</option>
                                                    <option value="PER-METHOD">script-by-script</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Row>
                                        <Row>
                                            <Form.Group controlId="formFile" className="mb-3">
                                                <Form.Label>Upload project</Form.Label>
                                                <Form.Control type="file" ref={fileRef} />
                                            </Form.Group>
                                            <Button className={"mb-5"} type={"submit"}>Upload</Button>
                                        </Row>
                                    </Form>
                                </Col>
                            </Row>
                        </Container>
                    </Col>

                </Row>
            </Container>
        </>
    )
}