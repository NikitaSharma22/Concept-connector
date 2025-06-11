import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LucideDownload, LucideArrowRight, LucideAlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- Helper functions and constants ---
const nodeColorPalette = [
    { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
    { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-800' },
    { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
    { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-800' },
    { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-800' },
];

const overflowPastelColors = [
    'bg-rose-50/80',
    'bg-amber-50/80',
    'bg-emerald-50/80',
    'bg-blue-50/80',
];

const NODE_WIDTH = 140;
const NODE_HEIGHT = 56;
const LABEL_WIDTH = 160;
const LABEL_HEIGHT = 50;
const OVERLAP_PADDING = 15;

const doRectsOverlap = (rect1, rect2) => {
    return !(
        rect2.left > rect1.right + OVERLAP_PADDING ||
        rect2.right < rect1.left - OVERLAP_PADDING ||
        rect2.top > rect1.bottom + OVERLAP_PADDING ||
        rect2.bottom < rect1.top - OVERLAP_PADDING
    );
};

const OverflowCard = ({ edge }) => (
    <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 w-full">
        <div className="flex items-center gap-1.5 font-bold text-slate-600 text-sm mb-1 truncate">
            <span className={`truncate ${edge.from.color.text}`}>{edge.from.label}</span>
            <LucideArrowRight size={14} className="text-slate-400 flex-shrink-0" />
            <span className={`truncate ${edge.to.color.text}`}>{edge.to.label}</span>
        </div>
        <p className="text-slate-500 text-xs leading-snug">{edge.label}</p>
    </div>
);

const OverflowSection = ({ edges, color, title }) => {
    if (edges.length === 0) return null;
    return (
        <div className={`p-3 rounded-lg flex flex-col gap-2 backdrop-blur-md border border-slate-200/50 ${color}`}>
            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 sticky top-0 pb-1">
                <LucideAlertTriangle size={16} className="text-amber-600" />
                {title}
            </h4>
            <div className="flex flex-col gap-2 overflow-y-auto">
                {edges.map(edge => <OverflowCard key={edge.id} edge={edge} />)}
            </div>
        </div>
    );
};


export const ConceptMap = ({ data }) => {
    const captureAreaRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setContainerSize({ width, height });
            }
        });
        const currentRef = mapContainerRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef) };
    }, []);

    const finalLayout = useMemo(() => {
        if (!data?.connections || containerSize.width === 0) {
            return { visibleNodes: [], visibleEdges: [], overflowEdges: [[], [], [], []] };
        }

        const { width, height } = containerSize;
        
        // **ADJUSTED**: Margins are tweaked to shift the map area down.
        const margin = {
            top: height * 0.1,    // More space at the top (pushes map down)
            right: width * 0.24,  // Unchanged
            bottom: height * 0.04,  // Less space at the bottom (allows map to sit lower)
            left: width * 0.24,   // Unchanged
        };

        const mapWidth = width - margin.left - margin.right;
        const mapHeight = height - margin.top - margin.bottom;

        const nodeMap = new Map();
        const nodeIds = [...new Set(data.connections.flatMap(c => [c.from, c.to]))];

        nodeIds.forEach((id, i) => {
            const angle = (i / nodeIds.length) * 2 * Math.PI - Math.PI / 2;
            
            // **ADJUSTED**: Radius multiplier is increased to make the circle bigger.
            const radius = Math.min(mapWidth, mapHeight) * 0.5;

            nodeMap.set(id, {
                id: id, label: id, color: nodeColorPalette[i % nodeColorPalette.length],
                x: margin.left + (mapWidth / 2) + radius * Math.cos(angle),
                y: margin.top + (mapHeight / 2) + radius * Math.sin(angle),
            });
        });

        // The rest of the layout and collision logic remains the same.
        const layoutItems = [];
        const allEdges = [];

        for (const node of nodeMap.values()) {
            layoutItems.push({
                type: 'node', id: node.id,
                bbox: {
                    left: node.x - NODE_WIDTH / 2, right: node.x + NODE_WIDTH / 2,
                    top: node.y - NODE_HEIGHT / 2, bottom: node.y + NODE_HEIGHT / 2
                }, item: node
            });
        }

        data.connections.forEach((conn, i) => {
            const fromNode = nodeMap.get(conn.from);
            const toNode = nodeMap.get(conn.to);
            if (!fromNode || !toNode || !conn.label) return;
            const edge = {
                id: `e${i}`, label: conn.label, from: fromNode, to: toNode,
                pos: {
                    x: fromNode.x + (toNode.x - fromNode.x) * 0.5,
                    y: fromNode.y + (toNode.y - fromNode.y) * 0.5,
                }
            };
            allEdges.push(edge);
            layoutItems.push({
                type: 'label', id: edge.id,
                bbox: {
                    left: edge.pos.x - LABEL_WIDTH / 2, right: edge.pos.x + LABEL_WIDTH / 2,
                    top: edge.pos.y - LABEL_HEIGHT / 2, bottom: edge.pos.y + LABEL_HEIGHT / 2
                }, item: edge
            });
        });

        const edgesToOverflow = new Set();
        for (let i = 0; i < layoutItems.length; i++) {
            for (let j = i + 1; j < layoutItems.length; j++) {
                if (doRectsOverlap(layoutItems[i].bbox, layoutItems[j].bbox)) {
                    if (layoutItems[i].type === 'label') edgesToOverflow.add(layoutItems[i].id);
                    if (layoutItems[j].type === 'label') edgesToOverflow.add(layoutItems[j].id);
                }
            }
        }
        
        const visibleEdges = allEdges.filter(edge => !edgesToOverflow.has(edge.id));
        const overflowed = allEdges.filter(edge => edgesToOverflow.has(edge.id));
        const visibleNodeIds = new Set(visibleEdges.flatMap(e => [e.from.id, e.to.id]));
        const visibleNodes = Array.from(nodeMap.values()).filter(node => visibleNodeIds.has(node.id));

        const overflowEdges = [[], [], [], []];
        overflowed.forEach((edge, index) => {
            overflowEdges[index % 4].push(edge);
        });

        return { visibleNodes, visibleEdges, overflowEdges };

    }, [data, containerSize]);

    const handleDownload = () => {
        html2canvas(captureAreaRef.current, { backgroundColor: '#F8FAFC', scale: 2, logging: false, useCORS: true })
            .then(canvas => {
                const link = document.createElement('a');
                link.download = 'concept-connector-map.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
    };

    return (
        <div className="flex flex-col items-center">
            <div id="capture-area" ref={captureAreaRef} className="w-full bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div ref={mapContainerRef} className="relative w-full h-[700px] sm:h-[800px]">

                    {/* --- Four Corner Overflow Sections --- */}
                    <div className="absolute top-0 left-0 h-1/2 w-1/4 p-2 flex flex-col justify-start">
                        <OverflowSection title="Additional Connections" edges={finalLayout.overflowEdges[1]} color={overflowPastelColors[0]} />
                    </div>
                    <div className="absolute top-0 right-0 h-1/2 w-1/4 p-2 flex flex-col justify-start">
                        <OverflowSection title="Additional Connections" edges={finalLayout.overflowEdges[0]} color={overflowPastelColors[1]} />
                    </div>
                    <div className="absolute bottom-0 left-0 h-1/2 w-1/4 p-2 flex flex-col justify-end">
                        <OverflowSection title="Additional Connections" edges={finalLayout.overflowEdges[3]} color={overflowPastelColors[2]}/>
                    </div>
                    <div className="absolute bottom-0 right-0 h-1/2 w-1/4 p-2 flex flex-col justify-end">
                         <OverflowSection title="Additional Connections" edges={finalLayout.overflowEdges[2]} color={overflowPastelColors[3]}/>
                    </div>
                    
                    {/* --- SVG Lines --- */}
                    <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                            </marker>
                        </defs>
                        <g>
                            {finalLayout.visibleEdges.map(edge => (
                                <line key={edge.id} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                            ))}
                        </g>
                    </svg>

                    {/* --- Visible Labels --- */}
                    {finalLayout.visibleEdges.map(edge => (
                         <div key={edge.id} className="absolute z-10" style={{ left: `${edge.pos.x}px`, top: `${edge.pos.y}px`, transform: `translate(-50%, -50%)` }}>
                            <span
                                className="block bg-slate-100/80 backdrop-blur-sm px-2 py-1 text-xs sm:text-sm text-slate-700 font-medium rounded-md shadow-sm border border-slate-200 text-center"
                                style={{ maxWidth: `${LABEL_WIDTH}px` }}
                            >
                                {edge.label}
                            </span>
                        </div>
                    ))}
                    
                    {/* --- Visible Nodes --- */}
                    {finalLayout.visibleNodes.map(node => (
                        <div
                            key={node.id}
                            className={`absolute z-20 flex items-center justify-center p-3 rounded-lg shadow-lg text-center transform -translate-x-1/2 -translate-y-1/2 border-2 ${node.color.bg} ${node.color.border}`}
                            style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }}
                        >
                            <span className={`font-bold text-sm sm:text-base ${node.color.text}`}>{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-4">
               <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:lg">
                <LucideDownload size={16} /> Download as Image
               </button>
            </div>
        </div>
    );
};

export default ConceptMap;
