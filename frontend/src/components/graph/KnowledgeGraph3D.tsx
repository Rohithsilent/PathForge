"use client"
import React, { useEffect, useRef, useState, useMemo, Suspense, Component } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Billboard, Text, Line, OrbitControls } from "@react-three/drei"
import { useGraphStore } from "@/stores/graphStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import { getCategoryGlyph, getTechIcon } from "@/lib/tech-metadata"
import { X } from "lucide-react"
import * as THREE from "three"
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
} from "d3-force-3d"

// ─── Helpers ───
// Short, stable abbreviation used inside fallback badges when a node has no
// logo (e.g. "System Design" -> "SD").
function abbreviate(name: string): string {
    const words = (name || "").trim().split(/[\s._/+-]+/).filter(Boolean)
    if (words.length === 0) return ""
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

// Market demand colour scale shared by the node badge and the legend.
function demandColor(demand: number): string {
    if (demand >= 80) return "#EF4444" // high
    if (demand >= 60) return "#F59E0B" // medium
    return "#64748B" // low
}

// Canvas arc/rounded-rect helpers (roundRect is not available everywhere).
function roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

// ─── Types ───
interface SimNode {
    id: string
    name: string
    category: string
    maturity: number
    market_demand: number
    source?: string
    icon?: string
    x: number
    y: number
    z: number
    vx?: number
    vy?: number
    vz?: number
}

interface SimLink {
    source: string | SimNode
    target: string | SimNode
    type: string
    label?: string
    strength: number
}

// ─── Single Graph Node ───
function GraphNode({
    node,
    onClick,
    isSelected,
}: {
    node: SimNode
    onClick: () => void
    isSelected: boolean
}) {
    const { marketOverlay } = useGraphStore()
    const meshRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)
    // Shared resolver handles aliases (html/css), display names and repo:* nodes.
    const iconUrl = getTechIcon(node.id, node.name)
    const color = CATEGORY_COLORS[node.category] || "#64748B"

    // Market Analysis Logic
    const isHighDemand = node.market_demand >= 80
    const dim = marketOverlay && !isHighDemand && !isSelected
    const highlight = marketOverlay && isHighDemand

    // Smooth position animation + gentle floating
    useFrame((state) => {
        if (meshRef.current) {
            // Unique offset per node for organic feel
            const offset = node.id.length * 0.7
            const floatY = Math.sin(state.clock.elapsedTime * 0.6 + offset) * 1.5
            const floatX = Math.cos(state.clock.elapsedTime * 0.4 + offset) * 0.8

            meshRef.current.position.lerp(
                new THREE.Vector3(
                    (node.x || 0) + floatX,
                    (node.y || 0) + floatY,
                    node.z || 0
                ),
                0.08
            )
            // Pulse effect for high demand nodes
            if (highlight) {
                const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12
                meshRef.current.scale.setScalar(s)
            } else {
                // Subtle breathing effect on all nodes
                const breath = 1 + Math.sin(state.clock.elapsedTime * 1.2 + offset) * 0.03
                meshRef.current.scale.setScalar(breath)
            }
        }
    })

    const baseScale = isSelected ? 1.3 : hovered ? 1.15 : 1
    const finalOpacity = dim ? 0.2 : 1

    return (
        <group ref={meshRef}>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                {/* Glow ring behind icon */}
                <mesh scale={[baseScale * 5, baseScale * 5, 1]}>
                    <circleGeometry args={[1, 32]} />
                    <meshBasicMaterial
                        color={highlight ? "#EF4444" : color} // Red glow if high demand
                        transparent
                        opacity={highlight ? 0.6 : isSelected ? 0.35 : hovered ? 0.2 : 0.1}
                    />
                </mesh>

                {/* Icon or Fallback Badge */}
                <group>
                    <Suspense fallback={null}>
                        {iconUrl ? (
                            <IconSprite
                                url={iconUrl}
                                scale={baseScale * 5}
                                onClick={onClick}
                                onPointerOver={() => setHovered(true)}
                                onPointerOut={() => setHovered(false)}
                                opacity={finalOpacity}
                            />
                        ) : (
                            <FallbackBadge
                                glyph={getCategoryGlyph(node.category)}
                                abbr={abbreviate(node.name)}
                                color={color}
                                scale={baseScale * 5}
                                onClick={onClick}
                                onPointerOver={() => setHovered(true)}
                                onPointerOut={() => setHovered(false)}
                                opacity={finalOpacity}
                            />
                        )}
                    </Suspense>
                </group>

                {/* Demand Badge (only when Market Analysis is ON) */}
                {marketOverlay && (
                    <MarketDemandBadge demand={node.market_demand} scale={baseScale} />
                )}

                {/* Name Label */}
                <Text
                    position={[0, -5.5 * baseScale, 0]}
                    fontSize={1.4}
                    color="#0F172A"
                    fillOpacity={finalOpacity}
                    anchorX="center"
                    anchorY="top"
                    // font="/fonts/SpaceMono-Bold.ttf" 
                    // Using default font for now to match Geist vibe
                    outlineWidth={0.05}
                    outlineColor="#FFFFFF"
                >
                    {node.name}
                </Text>

                {/* Category tag */}
                <Text
                    position={[0, -7.2 * baseScale, 0]}
                    fontSize={0.9}
                    color={color}
                    fillOpacity={finalOpacity}
                    anchorX="center"
                    anchorY="top"
                    outlineWidth={0.02}
                    outlineColor="#FFFFFF"
                >
                    {node.category.toUpperCase()}
                </Text>
            </Billboard>
        </group>
    )
}

// ─── Icon Sprite (loads SVG as image texture) ───
function IconSprite({
    url,
    scale,
    onClick,
    onPointerOver,
    onPointerOut,
    opacity = 1,
}: {
    url: string
    scale: number
    onClick: () => void
    onPointerOver: () => void
    onPointerOut: () => void
    opacity?: number
}) {
    // Rasterise the SVG into a 2D canvas first. Uploading an SVG image
    // directly to WebGL fails in some Chromium builds ("bad image data"),
    // while a CanvasTexture is reliable everywhere.
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

    useEffect(() => {
        let cancelled = false
        let tex: THREE.CanvasTexture | null = null
        const image = new Image()
        image.decoding = "async"

        image.onload = () => {
            if (cancelled) return
            const size = 256
            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const pad = 12
            const ratio = Math.min(
                (size - pad * 2) / (image.naturalWidth || size),
                (size - pad * 2) / (image.naturalHeight || size)
            )
            const drawW = (image.naturalWidth || size) * ratio
            const drawH = (image.naturalHeight || size) * ratio
            ctx.clearRect(0, 0, size, size)
            ctx.drawImage(image, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH)

            tex = new THREE.CanvasTexture(canvas)
            tex.colorSpace = THREE.SRGBColorSpace
            tex.needsUpdate = true
            setTexture(tex)
        }
        image.onerror = () => {
            // No texture: the fallback badge is not rendered for this node,
            // so it simply stays as a glow until the asset loads again.
        }
        image.src = url

        return () => {
            cancelled = true
            tex?.dispose()
        }
    }, [url])

    if (!texture) return null

    return (
        <sprite
            scale={[scale, scale, 1]}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <spriteMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
        </sprite>
    )
}

// ─── Fallback Badge (canvas-drawn category badge with glyph + abbreviation) ───
function FallbackBadge({
    glyph,
    abbr,
    color,
    scale,
    onClick,
    onPointerOver,
    onPointerOut,
    opacity = 1,
}: {
    glyph: string
    abbr: string
    color: string
    scale: number
    onClick: () => void
    onPointerOver: () => void
    onPointerOut: () => void
    opacity?: number
}) {
    const texture = useMemo(() => {
        if (typeof document === "undefined") return null

        const size = 256
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        const cx = size / 2
        const cy = size / 2
        const radius = size / 2 - 12

        // Category-coloured disc with a soft drop shadow.
        ctx.save()
        ctx.shadowColor = "rgba(15,23,42,0.35)"
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 5
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Subtle top light / bottom shade so the badge reads as a button.
        const sheen = ctx.createLinearGradient(0, 12, 0, size - 12)
        sheen.addColorStop(0, "rgba(255,255,255,0.30)")
        sheen.addColorStop(0.55, "rgba(255,255,255,0.04)")
        sheen.addColorStop(1, "rgba(0,0,0,0.12)")
        ctx.fillStyle = sheen
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()

        // White rim.
        ctx.strokeStyle = "rgba(255,255,255,0.9)"
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2)
        ctx.stroke()

        // Category glyph. Emoji font stack ensures colour emoji on Windows,
        // macOS and Linux; plain glyphs like "{ }" still render from Arial.
        const hasAbbr = abbr.length > 0
        const glyphSize = glyph.length > 2 ? 76 : 100
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#FFFFFF"
        ctx.font = `${glyphSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",Arial,sans-serif`
        ctx.fillText(glyph, cx, hasAbbr ? cy - 24 : cy + 2)

        // Short abbreviation under the glyph.
        if (hasAbbr) {
            ctx.globalAlpha = 0.95
            ctx.font = 'bold 40px Arial, "Segoe UI", sans-serif'
            ctx.fillText(abbr, cx, cy + 64)
            ctx.globalAlpha = 1
        }

        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        return tex
    }, [glyph, abbr, color])

    useEffect(() => {
        return () => {
            texture?.dispose()
        }
    }, [texture])

    return (
        <sprite
            scale={[scale, scale, 1]}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <spriteMaterial
                map={texture ?? undefined}
                transparent
                opacity={opacity}
                toneMapped={false}
            />
        </sprite>
    )
}

// ─── Market Demand Badge (canvas-texture pill above the node) ───
function MarketDemandBadge({
    demand,
    scale,
    opacity = 1,
}: {
    demand: number
    scale: number
    opacity?: number
}) {
    const fill = demandColor(demand)

    const texture = useMemo(() => {
        if (typeof document === "undefined") return null

        const width = 320
        const height = 128
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        const inset = 8
        const pillW = width - inset * 2
        const pillH = height - inset * 2
        const radius = pillH / 2

        // Colour-coded pill with a soft shadow.
        ctx.save()
        ctx.shadowColor = "rgba(15,23,42,0.28)"
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 5
        roundedRectPath(ctx, inset, inset, pillW, pillH, radius)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.restore()

        // Subtle top sheen for depth.
        ctx.save()
        roundedRectPath(ctx, inset, inset, pillW, pillH, radius)
        ctx.clip()
        const sheen = ctx.createLinearGradient(0, inset, 0, height - inset)
        sheen.addColorStop(0, "rgba(255,255,255,0.22)")
        sheen.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = sheen
        ctx.fillRect(inset, inset, pillW, pillH)
        ctx.restore()

        // White rim.
        ctx.strokeStyle = "rgba(255,255,255,0.9)"
        ctx.lineWidth = 5
        roundedRectPath(ctx, inset + 2.5, inset + 2.5, pillW - 5, pillH - 5, radius - 2.5)
        ctx.stroke()

        // Percentage.
        ctx.fillStyle = "#FFFFFF"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = '800 64px Inter, "Segoe UI", Arial, sans-serif'
        ctx.fillText(`${demand}%`, width / 2, height / 2 + 2)

        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        return tex
    }, [demand, fill])

    useEffect(() => {
        return () => {
            texture?.dispose()
        }
    }, [texture])

    return (
        <sprite
            position={[0, 4.4 * scale, 0]}
            scale={[scale * 4, scale * 1.6, 1]}
            renderOrder={2}
        >
            <spriteMaterial
                map={texture ?? undefined}
                transparent
                opacity={opacity}
                depthWrite={false}
                toneMapped={false}
            />
        </sprite>
    )
}

// ─── Graph Link (line between two nodes) ───
function GraphLink({ link, isHighlighted }: { link: SimLink; isHighlighted?: boolean }) {
    const ref = useRef<any>(null)
    const source = link.source as SimNode
    const target = link.target as SimNode

    const points = useMemo(() => {
        if (!source?.x || !target?.x) return [new THREE.Vector3(), new THREE.Vector3()]
        return [
            new THREE.Vector3(source.x, source.y, source.z),
            new THREE.Vector3(target.x, target.y, target.z),
        ]
    }, [source?.x, source?.y, source?.z, target?.x, target?.y, target?.z])

    const midpoint = useMemo(() => {
        return new THREE.Vector3(
            ((source?.x || 0) + (target?.x || 0)) / 2,
            ((source?.y || 0) + (target?.y || 0)) / 2,
            ((source?.z || 0) + (target?.z || 0)) / 2,
        )
    }, [source?.x, source?.y, source?.z, target?.x, target?.y, target?.z])

    const linkLabel = (link as any).label || ""

    return (
        <>
            <Line
                points={points}
                color={isHighlighted ? "#F97316" : "#CBD5E1"}
                lineWidth={isHighlighted ? 2 : 1}
                transparent
                opacity={isHighlighted ? 0.95 : 0.6}
            />
            {linkLabel && (
                <Billboard position={midpoint}>
                    <Text
                        fontSize={isHighlighted ? 1.0 : 0.8}
                        color={isHighlighted ? "#EA580C" : "#64748B"}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.06}
                        outlineColor="#FAFAFA"
                    >
                        {linkLabel}
                    </Text>
                </Billboard>
            )}
        </>
    )
}

// ─── Scene (runs force simulation + renders nodes/links) ───
function GraphScene() {
    const {
        graphData,
        setSelectedNode,
        selectedNode,
        searchTerm,
        filterCategory,
        filterSource,
        activeRepos,
    } = useGraphStore()
    const [simNodes, setSimNodes] = useState<SimNode[]>([])
    const [simLinks, setSimLinks] = useState<SimLink[]>([])
    const simRef = useRef<any>(null)

    // Initialize force simulation
    useEffect(() => {
        if (graphData.nodes.length === 0) return

        const nodes: SimNode[] = graphData.nodes.map((n: any) => ({
            ...n,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100,
        }))

        const links: SimLink[] = graphData.links.map((l: any) => ({
            ...l,
            source: l.source,
            target: l.target,
        }))

        const sim = forceSimulation(nodes, 3)
            .force(
                "link",
                forceLink(links)
                    .id((d: any) => d.id)
                    .distance(25)
                    .strength((l: any) => l.strength * 1.5)
            )
            .force("charge", forceManyBody().strength(-40))
            .force("center", forceCenter())
            .alpha(1)
            .alphaDecay(0.03)

        sim.on("tick", () => {
            setSimNodes([...nodes])
            setSimLinks([...links])
        })

        simRef.current = sim

        return () => {
            sim.stop()
        }
    }, [graphData])

    // Resolve which node IDs belong to activeRepos (via direct property OR link connection)
    const activeRepoNodeIds = useMemo(() => {
        if (!activeRepos || activeRepos.size === 0) return null
        const ids = new Set<string>()

        // 1. All repo nodes matching activeRepos
        const matchingRepoNodes = graphData.nodes.filter(
            (n) => n.category === "repo" && activeRepos.has(n.name)
        )
        const repoNodeIds = new Set(matchingRepoNodes.map((n) => n.id))
        repoNodeIds.forEach((id) => ids.add(id))

        // 2. Direct property matches
        graphData.nodes.forEach((n) => {
            if (n.repo && activeRepos.has(n.repo)) ids.add(n.id)
            if (Array.isArray(n.repos) && n.repos.some((r: string) => activeRepos.has(r))) ids.add(n.id)
        })

        // 3. Link matches (nodes connected to active repo nodes)
        if (graphData.links) {
            graphData.links.forEach((l: any) => {
                const src = typeof l.source === "string" ? l.source : l.source?.id
                const tgt = typeof l.target === "string" ? l.target : l.target?.id
                if (src && repoNodeIds.has(src) && tgt) ids.add(tgt)
                if (tgt && repoNodeIds.has(tgt) && src) ids.add(src)
            })
        }

        return ids
    }, [graphData, activeRepos])

    // Nodes connected to the selectedNode (if one is selected)
    const connectedNodeIds = useMemo(() => {
        if (!selectedNode) return null
        const ids = new Set<string>()
        ids.add(selectedNode.id)
        if (selectedNode.name) ids.add(selectedNode.name)

        // 1. Scan links in simLinks and graphData.links
        const linksToScan = simLinks.length > 0 ? simLinks : (graphData.links || [])
        linksToScan.forEach((l: any) => {
            const srcId = typeof l.source === "string" ? l.source : l.source?.id
            const tgtId = typeof l.target === "string" ? l.target : l.target?.id
            const isSrcMatch = srcId === selectedNode.id || srcId === selectedNode.name
            const isTgtMatch = tgtId === selectedNode.id || tgtId === selectedNode.name
            if (isSrcMatch && tgtId) ids.add(tgtId)
            if (isTgtMatch && srcId) ids.add(srcId)
        })

        if (graphData.links) {
            graphData.links.forEach((l: any) => {
                const srcId = typeof l.source === "string" ? l.source : l.source?.id
                const tgtId = typeof l.target === "string" ? l.target : l.target?.id
                const isSrcMatch = srcId === selectedNode.id || srcId === selectedNode.name
                const isTgtMatch = tgtId === selectedNode.id || tgtId === selectedNode.name
                if (isSrcMatch && tgtId) ids.add(tgtId)
                if (isTgtMatch && srcId) ids.add(srcId)
            })
        }

        // 2. Repo associations
        if (selectedNode.category === "repo") {
            graphData.nodes.forEach((n) => {
                if (n.repo === selectedNode.name || (Array.isArray(n.repos) && n.repos.includes(selectedNode.name))) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }
        if (selectedNode.repo) {
            graphData.nodes.forEach((n) => {
                if (n.category === "repo" && n.name === selectedNode.repo) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }
        if (Array.isArray(selectedNode.repos)) {
            graphData.nodes.forEach((n) => {
                if (n.category === "repo" && selectedNode.repos!.includes(n.name)) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }

        return ids
    }, [selectedNode, simLinks, graphData])

    // Filter nodes
    const visibleNodes = useMemo(() => {
        return simNodes.filter((node: any) => {
            // When a node is selected, ONLY show the selected node and the nodes directly connected to it!
            if (connectedNodeIds) {
                return connectedNodeIds.has(node.id) || connectedNodeIds.has(node.name)
            }

            const matchesSearch =
                !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory =
                !filterCategory || filterCategory === "all" || node.category === filterCategory

            // Source filter ('all' | 'github' | 'linkedin')
            const nodeSource = node.source || "github"
            const matchesSource =
                !filterSource || filterSource === "all" || nodeSource === filterSource

            // Repo filter: if activeRepos is set, node must match active repos
            const matchesRepo =
                !activeRepoNodeIds || activeRepoNodeIds.has(node.id)

            return matchesSearch && matchesCategory && matchesSource && matchesRepo
        })
    }, [simNodes, connectedNodeIds, searchTerm, filterCategory, filterSource, activeRepoNodeIds])

    const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])

    const visibleLinks = useMemo(() => {
        return simLinks.filter((l) => {
            const srcId = typeof l.source === "string" ? l.source : l.source.id
            const tgtId = typeof l.target === "string" ? l.target : l.target.id
            return visibleIds.has(srcId) && visibleIds.has(tgtId)
        })
    }, [simLinks, visibleIds])

    return (
        <>
            <ambientLight intensity={1.5} />
            <pointLight position={[50, 50, 50]} intensity={0.5} />

            {visibleLinks.map((link, i) => {
                const srcId = typeof link.source === "string" ? link.source : link.source?.id
                const tgtId = typeof link.target === "string" ? link.target : link.target?.id
                const isHighlighted = selectedNode && (
                    srcId === selectedNode.id || srcId === selectedNode.name ||
                    tgtId === selectedNode.id || tgtId === selectedNode.name
                )
                return (
                    <GraphLink key={i} link={link} isHighlighted={!!isHighlighted} />
                )
            })}

            {visibleNodes.map((node) => (
                <GraphNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onClick={() => {
                        if (selectedNode?.id === node.id) {
                            setSelectedNode(null)
                        } else {
                            setSelectedNode(node as any)
                        }
                    }}
                />
            ))}
        </>
    )
}

// ─── WebGL Error Boundary & 2D Fallback ───
class WebGLErrorBoundary extends Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: any) {
        console.warn("WebGL canvas error caught by boundary:", error)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback
        }
        return this.props.children
    }
}

function WebGLFallbackView() {
    const {
        graphData,
        selectedNode,
        setSelectedNode,
        searchTerm,
        filterCategory,
        filterSource,
        activeRepos,
    } = useGraphStore()

    const activeRepoNodeIds = useMemo(() => {
        if (!activeRepos || activeRepos.size === 0) return null
        const ids = new Set<string>()

        const matchingRepoNodes = graphData.nodes.filter(
            (n) => n.category === "repo" && activeRepos.has(n.name)
        )
        const repoNodeIds = new Set(matchingRepoNodes.map((n) => n.id))
        repoNodeIds.forEach((id) => ids.add(id))

        graphData.nodes.forEach((n) => {
            if (n.repo && activeRepos.has(n.repo)) ids.add(n.id)
            if (Array.isArray(n.repos) && n.repos.some((r: string) => activeRepos.has(r))) ids.add(n.id)
        })

        if (graphData.links) {
            graphData.links.forEach((l: any) => {
                const src = typeof l.source === "string" ? l.source : l.source?.id
                const tgt = typeof l.target === "string" ? l.target : l.target?.id
                if (src && repoNodeIds.has(src) && tgt) ids.add(tgt)
                if (tgt && repoNodeIds.has(tgt) && src) ids.add(src)
            })
        }

        return ids
    }, [graphData, activeRepos])

    const connectedNodeIds = useMemo(() => {
        if (!selectedNode) return null
        const ids = new Set<string>()
        ids.add(selectedNode.id)
        if (selectedNode.name) ids.add(selectedNode.name)

        if (graphData.links) {
            graphData.links.forEach((l: any) => {
                const srcId = typeof l.source === "string" ? l.source : l.source?.id
                const tgtId = typeof l.target === "string" ? l.target : l.target?.id
                const isSrcMatch = srcId === selectedNode.id || srcId === selectedNode.name
                const isTgtMatch = tgtId === selectedNode.id || tgtId === selectedNode.name
                if (isSrcMatch && tgtId) ids.add(tgtId)
                if (isTgtMatch && srcId) ids.add(srcId)
            })
        }

        if (selectedNode.category === "repo") {
            graphData.nodes.forEach((n) => {
                if (n.repo === selectedNode.name || (Array.isArray(n.repos) && n.repos.includes(selectedNode.name))) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }
        if (selectedNode.repo) {
            graphData.nodes.forEach((n) => {
                if (n.category === "repo" && n.name === selectedNode.repo) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }
        if (Array.isArray(selectedNode.repos)) {
            graphData.nodes.forEach((n) => {
                if (n.category === "repo" && selectedNode.repos!.includes(n.name)) {
                    ids.add(n.id)
                    ids.add(n.name)
                }
            })
        }

        return ids
    }, [selectedNode, graphData])

    const visibleNodes = useMemo(() => {
        return graphData.nodes.filter((node: any) => {
            if (connectedNodeIds) {
                return connectedNodeIds.has(node.id) || connectedNodeIds.has(node.name)
            }

            const matchesSearch =
                !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory =
                !filterCategory || filterCategory === "all" || node.category === filterCategory

            const nodeSource = node.source || "github"
            const matchesSource =
                !filterSource || filterSource === "all" || nodeSource === filterSource

            const matchesRepo =
                !activeRepoNodeIds || activeRepoNodeIds.has(node.id)

            return matchesSearch && matchesCategory && matchesSource && matchesRepo
        })
    }, [graphData.nodes, connectedNodeIds, searchTerm, filterCategory, filterSource, activeRepoNodeIds])

    return (
        <div className="w-full h-full p-4 md:p-6 overflow-y-auto flex flex-col gap-4 bg-[#F8F9FA]">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1 space-y-1">
                    <p className="font-bold text-amber-950">3D WebGL Acceleration is currently unavailable in this browser</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                        Your browser or graphics driver cannot initialize a 3D WebGL context. Displaying the interactive 2D node map below so all career scores, gaps, and insights remain fully functional.
                    </p>
                    <p className="text-[10px] text-amber-700">
                        Tip to enable 3D: In Chrome/Brave/Edge, open <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Settings &gt; System</code>, enable <strong>&ldquo;Use graphics acceleration when available&rdquo;</strong>, and restart the browser.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {visibleNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id
                    const color = CATEGORY_COLORS[node.category] || "#64748B"
                    return (
                        <button
                            key={node.id}
                            onClick={() => {
                                if (selectedNode?.id === node.id) {
                                    setSelectedNode(null)
                                } else {
                                    setSelectedNode(node as any)
                                }
                            }}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                    ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]"
                                    : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-sm"
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-2">
                                <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                    style={{
                                        backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : `${color}20`,
                                        color: isSelected ? "#FFFFFF" : color,
                                    }}
                                >
                                    {node.category}
                                </span>
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : `${demandColor(node.market_demand)}15`,
                                        color: isSelected ? "#FFFFFF" : demandColor(node.market_demand),
                                    }}
                                >
                                    {node.market_demand}%
                                </span>
                            </div>
                            <span className="font-bold text-xs truncate w-full">{node.name}</span>
                            <div className="w-full mt-2 pt-2 border-t border-slate-100/60 flex items-center justify-between text-[10px] opacity-75">
                                <span>Maturity</span>
                                <span className="font-semibold">{node.maturity}%</span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main Component (exported, wrapped in R3F Canvas) ───
export default function KnowledgeGraph3D() {
    const marketOverlay = useGraphStore((state) => state.marketOverlay)
    const selectedNode = useGraphStore((state) => state.selectedNode)
    const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
    const pointerDownPos = useRef({ x: 0, y: 0 })
    const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

    useEffect(() => {
        try {
            const canvas = document.createElement("canvas")
            const gl =
                canvas.getContext("webgl2") ||
                canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl")
            setWebglSupported(!!gl)
        } catch {
            setWebglSupported(false)
        }
    }, [])

    if (webglSupported === false) {
        return <WebGLFallbackView />
    }

    return (
        <WebGLErrorBoundary fallback={<WebGLFallbackView />}>
            <div
                className="relative w-full h-full"
                style={{ minHeight: "500px", background: "#F4F7FE" }}
            >
                <Canvas
                    shadows={false}
                    camera={{ position: [0, 0, 250], fov: 45 }}
                    onPointerDown={(e) => {
                        pointerDownPos.current = { x: e.clientX, y: e.clientY }
                    }}
                    onPointerMissed={(e) => {
                        const dx = Math.abs(e.clientX - pointerDownPos.current.x)
                        const dy = Math.abs(e.clientY - pointerDownPos.current.y)
                        if (dx < 6 && dy < 6) {
                            setSelectedNode(null)
                        }
                    }}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: "default",
                        failIfMajorPerformanceCaveat: false,
                    }}
                    dpr={[1, 2]}
                    performance={{ min: 0.5 }}
                >
                    <color attach="background" args={['#F4F7FE']} />
                    <Suspense fallback={null}>
                        <GraphScene />
                    </Suspense>
                    <OrbitControls
                        enableDamping
                        dampingFactor={0.05}
                        rotateSpeed={0.5}
                        minDistance={50}
                        maxDistance={600}
                    />
                </Canvas>

                {/* Focused Node Badge (shown when a node is selected and isolating connected nodes) */}
                {selectedNode && (
                    <div className="absolute top-3 right-3 sm:right-4 z-20 flex items-center gap-2.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-orange-200/90 shadow-md rounded-xl text-xs text-slate-800 transition-all pointer-events-auto">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] || "#F97316" }}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] text-orange-600 font-bold uppercase tracking-wider">
                                Focused Node
                            </span>
                            <span className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                                {selectedNode.name}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="ml-1 px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition flex items-center gap-1 text-[11px] font-bold border border-orange-200 cursor-pointer"
                            title="Show all nodes (reset focus)"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Show All</span>
                        </button>
                    </div>
                )}

                {/* Market demand legend (HTML overlay, must not swallow OrbitControls) */}
                {marketOverlay && (
                    <div className={`pointer-events-none absolute right-3 ${selectedNode ? "top-16" : "top-3"} z-10 select-none sm:right-4 ${selectedNode ? "sm:top-16" : "sm:top-4"}`}>
                    <div className="rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                            MARKET DEMAND
                        </p>
                        <ul className="mt-2 space-y-1.5 text-[11px] font-medium text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444] ring-2 ring-red-100" />
                                <span>High</span>
                                <span className="ml-auto pl-3 text-[10px] font-normal text-slate-400">
                                    ≥80%
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] ring-2 ring-amber-100" />
                                <span>Medium</span>
                                <span className="ml-auto pl-3 text-[10px] font-normal text-slate-400">
                                    60–79%
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#64748B] ring-2 ring-slate-100" />
                                <span>Low</span>
                                <span className="ml-auto pl-3 text-[10px] font-normal text-slate-400">
                                    {"<60%"}
                                </span>
                            </li>
                        </ul>
                        <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] leading-snug text-slate-400">
                            Badge on each node shows demand %
                        </p>
                    </div>
                </div>
            )}
        </div>
        </WebGLErrorBoundary>
    )
}
