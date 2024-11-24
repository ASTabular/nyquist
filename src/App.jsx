import React, { useState, useEffect } from 'react';
import { Slider } from './components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

const NyquistDemo = () => {
  const [signalFreq, setSignalFreq] = useState(1);
  const [samplingFreq, setSamplingFreq] = useState(8);
  const [time, setTime] = useState(0);
  const [showSincComponents, setShowSincComponents] = useState(false);

  // Animation frame
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => (t + 0.02) % 4);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  // Generate points for continuous signal
  const generateContinuousPoints = () => {
    const points = [];
    for (let t = 0; t < 4; t += 0.02) {
      points.push({
        x: t * 100,
        y: Math.sin(2 * Math.PI * signalFreq * t) * 80 + 100
      });
    }
    return points;
  };

  // Generate sampling points
  const generateSamplePoints = () => {
    const points = [];
    for (let t = 0; t < 4; t += 1/samplingFreq) {
      points.push({
        x: t * 100,
        y: Math.sin(2 * Math.PI * signalFreq * t) * 80 + 100,
        t: t
      });
    }
    return points;
  };

  // Sinc function
  const sinc = (x) => {
    if (x === 0) return 1;
    return Math.sin(Math.PI * x) / (Math.PI * x);
  };

  // Generate points for sinc interpolation
  const generateSincPoints = () => {
    const samples = generateSamplePoints();
    const points = [];
    const dt = 0.02;
    
    for (let t = 0; t < 4; t += dt) {
      let y = 0;
      // Sum the contribution of each sample
      samples.forEach(sample => {
        const sincValue = sinc(samplingFreq * (t - sample.t));
        y += (sample.y - 100) * sincValue;
      });
      points.push({
        x: t * 100,
        y: y + 100
      });
    }
    return points;
  };

  // Generate individual sinc components for visualization
  const generateSincComponents = () => {
    const samples = generateSamplePoints();
    return samples.map(sample => {
      const points = [];
      for (let t = 0; t < 4; t += 0.02) {
        const sincValue = sinc(samplingFreq * (t - sample.t));
        points.push({
          x: t * 100,
          y: (sample.y - 100) * sincValue + 100
        });
      }
      return points;
    });
  };

  const continuousPoints = generateContinuousPoints();
  const samplePoints = generateSamplePoints();
  const sincPoints = generateSincPoints();
  const sincComponents = showSincComponents ? generateSincComponents() : [];

  // Create SVG path from points
  const createPath = (points) => {
    return points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  };

  const nyquistLimit = samplingFreq / 2;
  const isAliasing = signalFreq > nyquistLimit;

  const PlotView = ({ showSinc }) => (
    <div className="relative h-52 w-full border rounded-lg overflow-hidden bg-gray-50">
      {/* Grid lines */}
      <svg width="100%" height="100%" className="absolute">
        {[...Array(8)].map((_, i) => (
          <line
            key={`grid-${i}`}
            x1="0"
            y1={i * 25 + 12.5}
            x2="100%"
            y2={i * 25 + 12.5}
            stroke="#ddd"
            strokeWidth="1"
          />
        ))}
      </svg>
      
      {/* Main visualization */}
      <svg width="100%" height="100%" className="absolute">
        {/* Original signal */}
        <path
          d={createPath(continuousPoints)}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeOpacity={showSinc ? 0.3 : 1}
        />
        
        {showSinc && (
          <>
            {/* Individual sinc components */}
            {showSincComponents && sincComponents.map((points, i) => (
              <path
                key={`sinc-component-${i}`}
                d={createPath(points)}
                fill="none"
                stroke="#9333ea"
                strokeWidth="1"
                strokeOpacity="0.2"
              />
            ))}
            
            {/* Reconstructed signal */}
            <path
              d={createPath(sincPoints)}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          </>
        )}
        
        {/* Sample points */}
        {samplePoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={isAliasing ? "#ef4444" : "#10b981"}
          />
        ))}
        
        {/* Vertical line for current time */}
        <line
          x1={time * 100}
          y1="0"
          x2={time * 100}
          y2="200"
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      </svg>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <Tabs defaultValue="sampling" className="w-full">
          <TabsList>
            <TabsTrigger value="sampling">Sampling</TabsTrigger>
            <TabsTrigger value="reconstruction">Reconstruction</TabsTrigger>
          </TabsList>
          <TabsContent value="sampling">
            <PlotView showSinc={false} />
          </TabsContent>
          <TabsContent value="reconstruction">
            <PlotView showSinc={true} />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Signal Frequency: {signalFreq.toFixed(1)} Hz
            </label>
            <Slider
              value={[signalFreq]}
              onValueChange={(value) => setSignalFreq(value[0])}
              min={0.2}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sampling Frequency: {samplingFreq.toFixed(1)} Hz
              {isAliasing && 
                <span className="ml-2 text-red-500">
                  (Aliasing detected! Sampling rate should be > {(signalFreq * 2).toFixed(1)} Hz)
                </span>
              }
            </label>
            <Slider
              value={[samplingFreq]}
              onValueChange={(value) => setSamplingFreq(value[0])}
              min={1}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showSinc"
              checked={showSincComponents}
              onChange={(e) => setShowSincComponents(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="showSinc" className="text-sm">
              Show individual sinc components
            </label>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Current Status:</h3>
            <ul className="space-y-1">
              <li>Nyquist Frequency: {nyquistLimit.toFixed(1)} Hz</li>
              <li>Samples per cycle: {(samplingFreq/signalFreq).toFixed(1)}</li>
              <li className={isAliasing ? "text-red-500" : "text-green-500"}>
                {isAliasing 
                  ? "⚠️ Aliasing occurring - signal cannot be reconstructed accurately"
                  : "✓ Signal can be accurately reconstructed"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NyquistDemo;