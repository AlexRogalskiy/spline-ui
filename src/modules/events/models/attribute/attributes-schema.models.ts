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

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { AttributeDataType, AttributeSchema } from 'spline-api'
import { SdWidgetCard, SdWidgetSchema } from 'spline-common'
import { SdWidgetAttributesTree, SplineAttributesTree } from 'spline-shared'


export function attributesSchemaToDataViewSchema(attributesSchema: AttributeSchema[],
                                                 dataTypes: AttributeDataType[],
                                                 selectedAttributeId$: Observable<string | null>): SdWidgetSchema {

    const treeData = SplineAttributesTree.toData(
        attributesSchema, dataTypes,
    )

    const treeOptions: Observable<SdWidgetAttributesTree.Options> = selectedAttributeId$
        .pipe(
            map(selectedAttributeId => ({ selectedAttributeId })),
        )

    return SdWidgetCard.toContentOnlySchema(
        SdWidgetAttributesTree.toSchema(treeData, treeOptions),
    )
}
