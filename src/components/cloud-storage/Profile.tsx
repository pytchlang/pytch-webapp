import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Spinner} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import React, {FormEvent, useEffect, useRef, useState} from "react";
import {PytchProgramKind} from "../../model/pytch-program-types";
import Card from "react-bootstrap/Card";
import {api, getCurrentUserProjects, getUserProfile, intToRole, refreshAccessToken, signOutUser} from "../../model/cloud-storage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDownload} from "@fortawesome/free-solid-svg-icons";
import {useStoreActions, useStoreState} from "../../store";
import {cloudProjectFromId} from "../../storage/zipfile";
import {useTranslation} from "react-i18next";
import CloudSidemenu from "./CloudSidemenu";
import {ProjectDto} from "../../model/project-core";
import {ListedProjectCard} from "./ListedProjectCard";

export default function Profile() {
    const [userProfile, setUserProfile] = useState(undefined);
    const [userProjects, setUserProjects] = useState(undefined);
    const fileRef = useRef(null);

    async function getUserProjects() {
        const data = await getCurrentUserProjects();
        console.log('user projects', data.data)
        try {
            setUserProjects(data.data);
        } catch (err) {
            console.error(err);
            if (err.status == 401) {
                setUserProfile(null);
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
            }

        }
    }

    const createProject = useStoreActions(
        (actions) => actions.demoFromZipfileURL.createProject
    );


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
                    <Col xs={12} md={2}>
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
                                                        <p>Role: {intToRole(userProfile.role)}</p>
                                                        <p>Created at: {new Date(userProfile.created_at).toUTCString()}</p>
                                                    </div>
                                                )
                                    }
                                </Col>
                                <Col>
                                    <h2>Published Projects {userProjects !== undefined && userProjects !== null && userProjects.length > 0 ? <span style={{fontSize: 16}}>{userProjects.length}</span> : undefined}</h2>
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
                                                                                    <ListedProjectCard
                                                                                        listedProject={p}
                                                                                        getUserProjects={getUserProjects}
                                                                                        setUserProfile={setUserProfile} />
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
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Container>
        </>
    )
}