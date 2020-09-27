/*
 * Copyright 2020 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ExecutionEventLineageNode, ExecutionEventLineageOverview, ExecutionEventLineageOverviewDepth, LineageNodeLink } from 'spline-api'
import { SdWidgetSchema } from 'spline-common/data-view'
import { SgData } from 'spline-common/graph'
import { SgNodeControl } from 'spline-shared/graph'
import { ProcessingStore, SplineEntityStore } from 'spline-utils'

import { EventInfo, EventNodeControl, EventNodeInfo } from '../../models'


export namespace EventOverviewStore {

    export type State = {
        nodes: SplineEntityStore.EntityState<ExecutionEventLineageNode>
        links: LineageNodeLink[]
        executionEventId: string | null
        eventInfo: EventInfo | null
        loadingProcessing: ProcessingStore.EventProcessingState
        graphLoadingProcessing: ProcessingStore.EventProcessingState
        selectedNodeId: string | null
        targetNodeId: string | null
        targetExecutionPlanNodeId: string | null
        lineageDepth: ExecutionEventLineageOverviewDepth
        graphHasMoreDepth: boolean
        selectedNodeRelations: EventNodeInfo.NodeRelationsInfo | null
        targetNodeDvs: SdWidgetSchema | null
        targetExecutionPlanNodeDvs: SdWidgetSchema | null
        graphNodeView: SgNodeControl.NodeView
        graphData: SgData | null
    }

    export const GRAPH_DEFAULT_DEPTH = 2

    const DEFAULT_LINEAGE_DEPTH = Object.freeze<ExecutionEventLineageOverviewDepth>({
        depthComputed: GRAPH_DEFAULT_DEPTH,
        depthRequested: GRAPH_DEFAULT_DEPTH,
    })

    export function getDefaultState(): State {
        return {
            nodes: SplineEntityStore.getDefaultState<ExecutionEventLineageNode>(),
            links: [],
            executionEventId: null,
            eventInfo: null,
            loadingProcessing: ProcessingStore.getDefaultProcessingState(),
            graphLoadingProcessing: ProcessingStore.getDefaultProcessingState(),
            selectedNodeId: null,
            targetNodeId: null,
            targetNodeDvs: null,
            selectedNodeRelations: null,
            targetExecutionPlanNodeId: null,
            targetExecutionPlanNodeDvs: null,
            lineageDepth: { ...DEFAULT_LINEAGE_DEPTH },
            graphHasMoreDepth: calculateHasMoreDepth(DEFAULT_LINEAGE_DEPTH),
            graphNodeView: SgNodeControl.NodeView.Detailed,
            graphData: null
        }
    }

    export function reduceLineageOverviewData(state: State,
                                              executionEventId: string,
                                              lineageOverview: ExecutionEventLineageOverview): State {

        const targetEdge = lineageOverview.lineage.links
            .find(
                x => x.target === lineageOverview.executionEventInfo.targetDataSourceId,
            )
        const eventNode = targetEdge
            ? lineageOverview.lineage.nodes.find(x => x.id === targetEdge.source)
            : undefined

        const nodesState = SplineEntityStore.addAll(lineageOverview.lineage.nodes, state.nodes)

        const newState = {
            ...state,
            nodes: nodesState,
            links: lineageOverview.lineage.links,
            eventInfo: {
                id: executionEventId,
                name: eventNode ? eventNode.name : 'NaN',
                applicationId: lineageOverview.executionEventInfo.applicationId,
                executedAt: new Date(lineageOverview.executionEventInfo.timestamp),
                executionPlan: eventNode
                    ? {
                        id: eventNode.id,
                        name: eventNode.name
                    }
                    : undefined
            },
            lineageDepth: lineageOverview.executionEventInfo.lineageDepth,
            graphHasMoreDepth: calculateHasMoreDepth(lineageOverview.executionEventInfo.lineageDepth),
            targetNodeId: lineageOverview.executionEventInfo.targetDataSourceId,
            targetNodeDvs: EventNodeInfo.toDataSchema(
                SplineEntityStore.selectOne(lineageOverview.executionEventInfo.targetDataSourceId, nodesState)
            ),
            targetExecutionPlanNodeId: eventNode.id,
            targetExecutionPlanNodeDvs: EventNodeInfo.toDataSchema(
                SplineEntityStore.selectOne(eventNode.id, nodesState)
            ),
        }

        return calculateGraphDataMiddleware(newState)
    }

    export function reduceGraphNodeView(state: State, graphNodeView: SgNodeControl.NodeView): State {
        return calculateGraphDataMiddleware({
            ...state,
            graphNodeView
        })
    }

    export function calculateGraphDataMiddleware(state: State): State {
        return {
            ...state,
            graphData: calculateGraphData(state)
        }
    }

    export function calculateGraphData(state: State): SgData {
        const nodesList = EventOverviewStore.selectAllNodes(state)
        return {
            links: state.links,
            nodes: nodesList
                // map node source data to the SgNode schema
                .map(
                    nodeSource => EventNodeControl.toSgNode(nodeSource, state.graphNodeView),
                ),
        }
    }

    export function reduceSelectedNodeId(nodeId: string | null, state: State): State {
        const selectedNode = nodeId ? selectNode(state, nodeId) : null

        return {
            ...state,
            selectedNodeId: nodeId,
            selectedNodeRelations: selectedNode
                ? {
                    node: selectedNode,
                    children: selectChildrenNodes(state, selectedNode.id),
                    parents: selectParentNodes(state, selectedNode.id),
                }
                : null
        }
    }

    export function selectAllNodes(state: State): ExecutionEventLineageNode[] {
        return SplineEntityStore.selectAll(state.nodes)
    }

    export function selectNode(state: State, nodeId: string): ExecutionEventLineageNode | undefined {
        return SplineEntityStore.selectOne(nodeId, state.nodes)
    }

    export function selectChildrenNodes(state: State, nodeId: string): ExecutionEventLineageNode[] {
        return state.links
            .filter(link => link.source === nodeId)
            .map(link => SplineEntityStore.selectOne(link.target, state.nodes))
    }

    export function selectParentNodes(state: State, nodeId: string): ExecutionEventLineageNode[] {
        return state.links
            .filter(link => link.target === nodeId)
            .map(link => SplineEntityStore.selectOne(link.source, state.nodes))
    }

    function calculateHasMoreDepth(lineageDepth: ExecutionEventLineageOverviewDepth): boolean {
        return lineageDepth.depthRequested === lineageDepth.depthComputed
    }

}
