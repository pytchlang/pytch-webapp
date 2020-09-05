import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { IAssetInProject } from "../model/asset";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/esm/Button";
import { SyncState } from "../model/project";
import { assetServer } from "../skulpt-connection/asset-server";

interface AssetCardProps {
  asset: IAssetInProject;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <Card className="AssetCard m-3">
      <Card.Body>
        <Card.Title>{asset.name}</Card.Title>
        <Card.Text>Asset ID is {asset.id}; thumbnail to follow.</Card.Text>
      </Card.Body>
    </Card>
  );
};

const Assets = () => {
  const syncState = useStoreState(
    (state) => state.activeProject.assetsSyncState
  );
  const assets = useStoreState((state) => state.activeProject.project?.assets);
  const showModal = useStoreActions((actions) => actions.modals.show);

  const showAddModal = () => {
    showModal("add-asset");
  };

  useEffect(() => {
    if (assets != null) {
      assetServer.prefetch(assets);
    }
  });

  switch (syncState) {
    case SyncState.NoProject:
      return <div>Assets will load shortly....</div>;
    case SyncState.SyncingFromStorage:
      return <div>Assets loading....</div>;
    case SyncState.Error:
      return <div>Assets failed to load, oh no</div>;
    case SyncState.SyncingToStorage:
    case SyncState.Syncd:
      break; // Handle normal cases below.
  }

  // TODO: Some representation that the assets are syncing to storage?

  if (assets == null) {
    throw Error("no project even though LoadingState succeeded");
  }

  return (
    <div>
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
      <div className="buttons">
        <Button onClick={showAddModal}>Add an image or sound</Button>
      </div>
    </div>
  );
};

const StandardOutput = () => {
  const text = useStoreState((state) => state.standardOutputPane.text);

  return <pre className="SkulptStdout">{text}</pre>;
};

const Errors = () => {
  return <div>Any errors your project encounters will appear here.</div>;
};

const InfoPanel = () => {
  const activeKey = useStoreState((state) => state.infoPanel.activeTabKey);
  const setActiveKey = useStoreActions(
    (state) => state.infoPanel.setActiveTabKey
  );

  return (
    <Tabs
      className="InfoPanel"
      transition={false}
      activeKey={activeKey}
      onSelect={(k) => setActiveKey(k as string)}
    >
      <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
        <Assets />
      </Tab>
      <Tab className="InfoPane" eventKey="output" title="Output">
        <StandardOutput />
      </Tab>
      <Tab className="InfoPane" eventKey="errors" title="Errors">
        <Errors />
      </Tab>
    </Tabs>
  );
};

export default InfoPanel;
