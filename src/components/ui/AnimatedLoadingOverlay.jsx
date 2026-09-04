import React from 'react';
import AiProcessingOverlay from './AiProcessingOverlay';

const AnimatedLoadingOverlay = ({ isVisible, message }) => {
  return (
    <AiProcessingOverlay 
      isVisible={isVisible} 
      title={message || "Drafting with Neural AI Engine"} 
    />
  );
};

export default AnimatedLoadingOverlay;
