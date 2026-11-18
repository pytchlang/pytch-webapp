import React from "react";
import {Button, Card, Col, Row} from "react-bootstrap";
import {useStoreActions, useStoreState} from "../../store";
import {CloudUserId, ProjectDto, ProjectVisibility} from "../../model/project-core";
import {api} from "../../model/cloud-storage";
import {faDownload, faEye, faFolder, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import {getProgramKindIcon} from "../../model/discoverable-demos";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Dropdown from "react-bootstrap/esm/Dropdown";
import {useTranslation} from "react-i18next";
import {useRunFlow} from "../../model";
import {MtimeDisplay} from "../MtimeDisplay";
import {Link, useNavigate} from "react-router-dom";
import {pathWithinApp} from "../../env-utils";

type ListedProjectCardProps = {
    getUserProjects: () => void,
    setUserProfile: () => void,
    listedProject: ProjectDto
};

export const CloudProjectCard: React.FC<ListedProjectCardProps> = (
    {
        getUserProjects,
        setUserProfile,
        listedProject,
        localAvailable,
        focusContext
    }
) => {


    async function handleDeleteProject(p: ProjectDto) {
        await api(`projects/${listedProject.id}`, {
            method: "DELETE",
        })

        getUserProjects()
    }

    function handleDownloadProject(project: ProjectDto) {
        console.log("download project");

        api(`projects/${project.id}/download`, {
            method: "GET",
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
            })
    }

    const boot = useStoreActions((actions) => actions.cloudProjectFromZipfileURL.boot);

    const cloudUserId: CloudUserId = useStoreState((state) => state.cloudUser.id);
    const createProject = useRunFlow((f) => f.createProjectFromCloudFlow);
    const runChangeProjectVisibility = useRunFlow((f) => f.changeProjectVisibilityFlow);
    const navigate = useNavigate();

    function handleOpenProject(p: ProjectDto) {
        console.log("opening project", p.id)
        console.log("checking for local version in", localAvailable);
        const localProject = localAvailable.filter((l) => l.summary.cloudProjectId === p.id)[0];
        console.log("localProjectFound", localProject);
        if (localProject) {
            const linkTarget = `/ide/${localProject.summary.id}`;
            console.log("navigating to localProject", linkTarget);
            navigate(pathWithinApp(linkTarget));
        }
        else {
            createProject({cloudProjectId: p.id, cloudUserId: cloudUserId})
        }
    }

    const programKindIcon = getProgramKindIcon(listedProject.program_kind);
    const { t: tCommon } = useTranslation("common");
    const { t } = useTranslation("projects");

    // TODO: const focusContext = useFocusContext("my-projects-list");


    const onChangeProjectVisibility = () => {
        runChangeProjectVisibility(
            {
                cloudProjectId: listedProject.id,
                projectName: listedProject.title,
                cloudProjectVisibility: listedProject.status,
                oldCloudProjectVisibility: listedProject.status,
                onDispose: focusContext.onDisposeRenameProject,
            }
        );
    };

    console.log("listed cloud project", listedProject);

    return (

            <Card
                className={"flex-row flex-wrap card project-card ProjectCard cloud-project-card"}
                tabIndex={0}
                data-demo-uuid={listedProject.id}
            >
                <Card.Header className={"p-0 w-100 bg-transparent border-0"}>
                    <div className={"pill-row w-100 p-3 m-0 d-flex justify-content-between"}>
                        <img src={programKindIcon.src} alt={programKindIcon.alt} />
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                ⋮
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item as={Button} onClick={() => handleOpenProject(listedProject)}>
                                    <FontAwesomeIcon icon={faFolder} className={"me-2"}/>Open
                                </Dropdown.Item>
                                <Dropdown.Item as={Button} onClick={() => handleDownloadProject(listedProject)}>
                                    <FontAwesomeIcon icon={faDownload} className={"me-2"}/>Download
                                </Dropdown.Item>
                                <Dropdown.Item as={Button} onClick={() => onChangeProjectVisibility()}>
                                    <FontAwesomeIcon icon={faEye} className={"me-2"}/>Change visibility
                                </Dropdown.Item>
                                <Dropdown.Item as={Button} onClick={() => handleDeleteProject(listedProject)}>
                                    <FontAwesomeIcon icon={faTrashCan} className={"me-2"}/>Delete
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                </Card.Header>
                <Card.Body className={"p-4 py-3"} >
                    <Link
                        to={""}
                        onClick={() => handleOpenProject(listedProject)}
                        tabIndex={-1}
                    >
                        <h3 >{listedProject.title}</h3>
                    </Link>
                    <Row className={"share-row"}>
                        <Col sm={12} className={"d-flex justify-content-between p-0 flex-column"}>
                            <p>
                                Visibility: {
                                listedProject.status === ProjectVisibility.PUBLIC ? "Public" :
                                    listedProject.status === ProjectVisibility.UNLISTED ? "Unlisted" :
                                        listedProject.status === ProjectVisibility.PRIVATE ? "Private"
                                            : ""
                            }
                            </p>
                            <br/>
                            <MtimeDisplay mtime={new Date(listedProject.updated_at)}/>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
    );
};
