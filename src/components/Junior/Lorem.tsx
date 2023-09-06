import React from "react";
import { EmptyProps } from "../../utils";

export const Lorem: React.FC<EmptyProps> = () => {
  let content = [];
  for (let i = 0; i !== 8; ++i) {
    content.push(
      <p key={i}>
        <strong>{i} — </strong>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec
        mauris varius, tincidunt tellus ac, tincidunt erat. Cras placerat, purus
        a venenatis volutpat, nulla nibh elementum urna, at efficitur sapien
        erat vel nulla. Phasellus et diam varius, consequat mauris vel, aliquam
        orci. Pellentesque molestie mauris massa, sed maximus risus pellentesque
        et. Donec fermentum lacus mollis massa dignissim, sed porta erat
        dignissim. Pellentesque vehicula eros nec arcu faucibus, eu faucibus
        magna pulvinar. Suspendisse sagittis, orci nec dictum consequat, urna
        dui consequat eros, id tempor massa nibh volutpat odio. Praesent dolor
        libero, interdum vitae elementum id, posuere id lorem. Integer faucibus
        risus quis ligula vulputate, et tempor purus elementum. Sed finibus nisi
        magna, id sagittis nisi scelerisque sodales. In vel sodales metus, id
        ornare libero. Aenean nec purus nec tellus semper fringilla eget et
        libero.
      </p>
    );
  }
  return <div className="Junior-Lorem">{content}</div>;
};
