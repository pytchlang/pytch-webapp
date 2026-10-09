import {NavBanner} from "../NavBanner";
import {Col, Container, Row, Spinner} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {getCurrentUserProjects, getUserProfile, signOutUser, UserRole} from "../../model/cloud-storage";
import {useStoreActions, useStoreState} from "../../store";
import {useTranslation} from "react-i18next";
import CloudSidemenu from "./CloudSidemenu";
import {ProjectDto} from "../../model/project-core";
import {ListedProjectCard} from "./ListedProjectCard";
import ManageStudents from "./ManageStudents";
import EditProfile from "./EditProfile";
import ChangeEmail from "./ChangeEmail";
import ChangePassword from "./ChangePassword";

interface ProfileProps {
    showPublicProjects?: boolean,
    showManagedStudents?: boolean,
    showEditProfile?: boolean,
    showChangeEmail?: boolean,
    showChangePassword?: boolean
}

export default function Profile({showPublicProjects, showManagedStudents, showEditProfile, showChangeEmail, showChangePassword}: ProfileProps) {
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

    function PublicProjects() {
        return (
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
                                            <p>Role: {UserRole[userProfile.role]}</p>
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
            </Container>)
    }

    return (
        <>
            <NavBanner />

            <Container className={"mx-auto mt-5"}>
                <Row>
                    <Col xs={12} md={3} lg={2}>
                        <CloudSidemenu userProfile={userProfile}/>
                    </Col>
                    <Col>
                        {showPublicProjects && <PublicProjects />}
                        {showManagedStudents && <ManageStudents />}
                        {showEditProfile && <EditProfile />}
                        {showChangeEmail && <ChangeEmail />}
                        {showChangePassword && <ChangePassword />}
                    </Col>
                </Row>
            </Container>
        </>
    )
}