import React, { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import LayerToolbar from './components/LayerToolbar';
import Viewport from './components/Viewport';
import RightPanel from './components/RightPanel';
import Ribbon from './components/Ribbon';
import WelcomeModal from './components/WelcomeModal';
import GlossaryPanel from './components/GlossaryPanel';
import Tooltip from './components/Tooltip';
import { api } from './services/api';
import { gisService } from './services/gisService';
import { DEFAULT_PROJECT } from './config';

export default function App() {
  // Application Data States
  const [segments, setSegments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [layers, setLayers] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [supportMatrix, setSupportMatrix] = useState(null);
  const [recommendationCategories, setRecommendationCategories] = useState([]);
  const [mapData, setMapData] = useState({
    route: null,
    landslides: null,
    faults: null,
    boreholes: null,
    groundwater: null,
    predictions: null
  });

  // UI Interactive States
  const [currentSegIdx, setCurrentSegIdx] = useState(null);
  const [layerState, setLayerState] = useState({
    geology: true,
    hydrology: true,
    faults: false,
    boreholes: false,
    terrain: false,
    pointcloud: false,
    hazard: true,
    confidence: false,
    rmrtrack: false,
    supporttrack: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [glossaryPanelOpen, setGlossaryPanelOpen] = useState(false);

  // Fetch all backend configs on initialization
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [
          segs,
          projs,
          lyrs,
          statusData,
          matrix,
          categories,
          mapRoute,
          mapLandslides,
          mapFaults,
          mapBoreholes,
          mapGroundwater,
          mapPredictions
        ] = await Promise.all([
          api.getSegments(),
          api.getProjects(),
          api.getLayers(),
          api.getStatus(),
          api.getSupportMatrix(),
          api.getCategories(),
          gisService.getMapRoute(),
          gisService.getMapLandslides(),
          gisService.getMapFaults(),
          gisService.getMapBoreholes(),
          gisService.getMapGroundwater(),
          gisService.getMapPredictions()
        ]);

        setSegments(segs);
        setProjects(projs);
        if (projs && projs.length > 0) {
          const defaultProj = projs.find(p => p.id === DEFAULT_PROJECT);
          setActiveProject(defaultProj ? defaultProj.name : projs[0].name);
        }
        setLayers(lyrs);
        if (lyrs) {
          const initLayers = {};
          lyrs.forEach(l => {
            initLayers[l.id] = l.default !== undefined ? l.default : !!layerState[l.id];
          });
          setLayerState(initLayers);
        }
        setSystemStatus(statusData);
        setSupportMatrix(matrix);
        setRecommendationCategories(categories);
        setMapData({
          route: mapRoute,
          landslides: mapLandslides,
          faults: mapFaults,
          boreholes: mapBoreholes,
          groundwater: mapGroundwater,
          predictions: mapPredictions
        });
      } catch (err) {
        console.error("Error loading Strata REST API services:", err);
      }
    }

    loadInitialData();

    try {
      const skip = sessionStorage.getItem('strata_skip_welcome') === '1';
      setWelcomeModalVisible(!skip);
    } catch (e) {
      setWelcomeModalVisible(true);
    }
  }, []);

  const handleToggleLayer = (id) => {
    setLayerState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectSegment = (idx) => {
    if (idx >= 0 && idx < segments.length) {
      setCurrentSegIdx(idx);
    }
  };

  const handleBackToOverview = () => {
    setCurrentSegIdx(null);
  };

  const handlePrevSegment = () => {
    setIsPlaying(false);
    if (currentSegIdx === null) {
      setCurrentSegIdx(0);
    } else if (currentSegIdx > 0) {
      setCurrentSegIdx(currentSegIdx - 1);
    }
  };

  const handleNextSegment = useCallback(() => {
    if (currentSegIdx === null) {
      setCurrentSegIdx(0);
    } else if (currentSegIdx < segments.length - 1) {
      setCurrentSegIdx(currentSegIdx + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentSegIdx, segments]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // If we are at the end or overview, start from the beginning
      if (currentSegIdx === null || currentSegIdx === segments.length - 1) {
        setCurrentSegIdx(0);
      }
    }
  };

  // Walkthrough autoplay loop handler
  useEffect(() => {
    if (!isPlaying || !segments || segments.length === 0) return;
    
    const timer = setInterval(() => {
      handleNextSegment();
    }, 2800);

    return () => clearInterval(timer);
  }, [isPlaying, segments, handleNextSegment]);

  const handleCloseWelcomeModal = (dontShowAgain) => {
    setWelcomeModalVisible(false);
    if (dontShowAgain) {
      try {
        sessionStorage.setItem('strata_skip_welcome', '1');
      } catch (e) {}
    }
  };

  return (
    <div className="app">
      {/* Top Header branding stats */}
      <TopBar 
        projects={projects}
        activeProject={activeProject}
        onChangeProject={setActiveProject}
        systemStatus={systemStatus}
        onOpenGlossary={() => setGlossaryPanelOpen(true)}
      />

      {/* Layer selector bar */}
      <LayerToolbar 
        layers={layers}
        layerState={layerState}
        onToggleLayer={handleToggleLayer}
      />

      {/* Main viewport panels */}
      <div className="main" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: '100%', overflow: 'hidden' }}>
        <Viewport 
          segments={segments}
          currentSegIdx={currentSegIdx}
          layerState={layerState}
          isPlaying={isPlaying}
          onSelectSegment={handleSelectSegment}
          onTogglePlay={handleTogglePlay}
          onPrevSegment={handlePrevSegment}
          onNextSegment={handleNextSegment}
          mapData={mapData}
        />

        <RightPanel 
          segments={segments}
          currentSegIdx={currentSegIdx}
          activeProject={activeProject}
          supportMatrix={supportMatrix}
          recommendationCategories={recommendationCategories}
          onBackToOverview={handleBackToOverview}
        />
      </div>

      {/* Risk inspection ribbon */}
      <Ribbon 
        segments={segments}
        currentSegIdx={currentSegIdx}
        onSelectSegment={handleSelectSegment}
      />

      {/* Help glossary overlay */}
      <GlossaryPanel 
        isOpen={glossaryPanelOpen}
        onClose={() => setGlossaryPanelOpen(false)}
      />

      {/* Onboarding introduction */}
      <WelcomeModal 
        visible={welcomeModalVisible}
        onClose={handleCloseWelcomeModal}
      />

      {/* Floating tooltip hover container */}
      <Tooltip />
    </div>
  );
}
