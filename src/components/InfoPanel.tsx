import React from "react";

const Assets = () => {
    return (
        <div>
            Your project's images and sounds.
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
    return (
        <div className="InfoPanel">
            Assets / StdOut / Errors / Tutorial
        </div>
    )
};

export default InfoPanel;
