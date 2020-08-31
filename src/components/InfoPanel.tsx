import React from "react";
import { useStoreState, useStoreActions } from "../store"
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { LoadingState } from "../model/projects";
import { IAssetInProject } from "../model/asset";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/esm/Button";

interface AssetCardProps {
    asset: IAssetInProject;
}

const AssetCard: React.FC<AssetCardProps> = ({asset}) => {
    return (
        <Card className="AssetCard m-3">
            <Card.Body>
                <Card.Title>{asset.name}</Card.Title>
                <Card.Text>
                    Asset ID is {asset.id}; thumbnail to follow.
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

const Assets = () => {
    const { loadingState, assets } = useStoreState(state => ({
        loadingState: state.activeProject.loadingState,
        assets: state.activeProject.project?.assets,
    }));
    const showModal = useStoreActions(actions => actions.modals.show);

    const showAddModal = () => { showModal("add-asset"); };

    switch (loadingState) {
        case LoadingState.Idle:
            return (<div>Assets will load shortly....</div>);
        case LoadingState.Pending:
            return (<div>Assets loading....</div>);
        case LoadingState.Failed:
            return (<div>Assets failed to load, oh no</div>);
        case LoadingState.Succeeded:
            break;  // Handle normal case below.
    }

    if (assets == null) {
        throw Error("no project even though LoadingState succeeded");
    }

    return (
        <div>
            {assets.map(asset => <AssetCard key={asset.id} asset={asset}/>)}
            <div className="buttons">
              <Button onClick={showAddModal}>Add an image or sound</Button>
            </div>
        </div>
    );
};

const StandardOutput = () => {
    return (
        <div>
            Anything your project prints will appear here.
        </div>
    )
}

const Errors = () => {
    return (
        <div>
            Any errors your project encounters will appear here.
        </div>
    );
}

const InfoPanel = () => {
    const activeKey = useStoreState(state => state.infoPanel.activeTabKey);
    const setActiveKey = useStoreActions(state => state.infoPanel.setActiveTabKey);

    return (
        <Tabs
            className="InfoPanel"
            transition={false}
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k as string)}
        >
            <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
                <Assets/>
            </Tab>
            <Tab className="InfoPane" eventKey="output" title="Output">
                <StandardOutput/>
            </Tab>
            <Tab className="InfoPane" eventKey="errors" title="Errors">
                <Errors/>
            </Tab>
        </Tabs>
    );
}

export default InfoPanel;
