/*
 * Copyright 2021 ABSA Group Limited
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

import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Observable } from 'rxjs'
import { filter, map, skip, take } from 'rxjs/operators'
import { SplineTabsNavBar } from 'spline-common'
import { BaseComponent } from 'spline-utils'

import { EventOverviewStore, EventOverviewStoreFacade } from '../../store'
import NavTabInfo = SplineTabsNavBar.NavTabInfo


@Component({
    selector: 'event-overview-page',
    templateUrl: './event-overview.page.component.html',
    styleUrls: ['./event-overview.page.component.scss'],
})
export class EventOverviewPageComponent extends BaseComponent implements OnInit, OnDestroy {

    readonly headerNavTabs: NavTabInfo[] = [
        {
            label: 'EVENTS.EVENT_OVERVIEW__NAV_TAB__GRAPH_VIEW',
            routeLink: '.',
            icon: 'graph-outline'
        }
    ]

    readonly state$: Observable<EventOverviewStore.State>

    constructor(private readonly activatedRoute: ActivatedRoute,
                readonly store: EventOverviewStoreFacade) {
        super()
        this.state$ = store.state$
    }

    ngOnInit(): void {

        const executionEventId = this.activatedRoute.snapshot.params['id']

        this.store.init(executionEventId)
    }

    ngOnDestroy(): void {
        super.ngOnDestroy()
        this.store.resetState()
    }

}
