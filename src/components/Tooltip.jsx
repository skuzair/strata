import React, { useEffect, useRef } from 'react';

export default function Tooltip() {
  const tooltipRef = useRef(null);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const showTooltip = (infoIc, text) => {
      tooltip.innerHTML = text;
      tooltip.className = 'app-tooltip'; // Reset classes
      
      const icRect = infoIc.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left = icRect.left + icRect.width / 2 - tooltipRect.width / 2;
      const padding = 12;
      const maxLeft = window.innerWidth - tooltipRect.width - padding;
      if (left < padding) left = padding;
      if (left > maxLeft) left = maxLeft;
      
      let top = icRect.top - tooltipRect.height - 10;
      let isBelow = false;
      
      if (top < padding) {
        top = icRect.bottom + 10;
        isBelow = true;
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      
      const iconCenter = icRect.left + icRect.width / 2;
      let arrowLeft = iconCenter - left;
      const arrowPadding = 12;
      if (arrowLeft < arrowPadding) arrowLeft = arrowPadding;
      if (arrowLeft > tooltipRect.width - arrowPadding) arrowLeft = tooltipRect.width - arrowPadding;
      tooltip.style.setProperty('--arrow-left', arrowLeft + 'px');
      
      if (isBelow) {
        tooltip.classList.add('below');
      } else {
        tooltip.classList.add('above');
      }
      
      requestAnimationFrame(() => {
        tooltip.classList.add('visible');
      });
    };

    const hideTooltip = () => {
      tooltip.classList.remove('visible');
    };

    const handleMouseOver = (e) => {
      const infoIc = e.target.closest('.info-ic');
      if (!infoIc) return;
      if (e.relatedTarget && e.relatedTarget.closest('.info-ic') === infoIc) return;
      
      const tipSpan = infoIc.querySelector('.tip');
      if (tipSpan) {
        showTooltip(infoIc, tipSpan.innerHTML);
      }
    };

    const handleMouseOut = (e) => {
      const infoIc = e.target.closest('.info-ic');
      if (!infoIc) return;
      if (e.relatedTarget && e.relatedTarget.closest('.info-ic') === infoIc) return;
      
      hideTooltip();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    
    const rightPanel = document.getElementById('rightPanel');
    if (rightPanel) {
      rightPanel.addEventListener('scroll', hideTooltip);
    }
    window.addEventListener('resize', hideTooltip);
    window.addEventListener('scroll', hideTooltip);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (rightPanel) {
        rightPanel.removeEventListener('scroll', hideTooltip);
      }
      window.removeEventListener('resize', handleMouseOut);
      window.removeEventListener('scroll', handleMouseOut);
    };
  }, []);

  return (
    <div 
      ref={tooltipRef} 
      id="appTooltip" 
      className="app-tooltip"
    ></div>
  );
}
