import React from 'react';
import { WhatsappShareButton, WhatsappIcon } from 'react-share';

const ShareLink = ({ url }) => {
  return (
    <div style={{ marginTop: '20px', zIndex: 100 }}>
      <WhatsappShareButton url={url}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
    </div>
  );
};

export default ShareLink;
