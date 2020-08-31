import React from "react";
import { useStoreState, useStoreActions } from "../store"
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { IAssetInProject } from "../model/asset";
import Card from "react-bootstrap/Card";

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
    return (
        <div>
            {assets.map(asset => <AssetCard key={asset.id} asset={asset}/>)}
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
