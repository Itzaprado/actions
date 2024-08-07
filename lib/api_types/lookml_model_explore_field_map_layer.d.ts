export declare enum LookmlModelExploreFieldMapLayerFormat {
    Topojson = "topojson",
    VectorTileRegion = "vector_tile_region"
}
export interface LookmlModelExploreFieldMapLayer {
    /** URL to the map layer resource. */
    url: string;
    /** Name of the map layer, as defined in LookML. */
    name: string;
    /** Specifies the name of the TopoJSON object that the map layer references. If not specified, use the first object.. */
    feature_key: string | null;
    /** Selects which property from the TopoJSON data to plot against. TopoJSON supports arbitrary metadata for each region. When null, the first matching property should be used. */
    property_key: string | null;
    /** Which property from the TopoJSON data to use to label the region. When null, property_key should be used. */
    property_label_key: string | null;
    /** The preferred geographic projection of the map layer when displayed in a visualization that supports multiple geographic projections. */
    projection: string | null;
    /** Specifies the data format of the region information. Valid values are: "topojson", "vector_tile_region". */
    format: LookmlModelExploreFieldMapLayerFormat;
    /** Specifies the URL to a JSON file that defines the geographic extents of each region available in the map layer. This data is used to automatically center the map on the available data for visualization purposes. The JSON file must be a JSON object where the keys are the mapping value of the feature (as specified by property_key) and the values are arrays of four numbers representing the west longitude, south latitude, east longitude, and north latitude extents of the region. The object must include a key for every possible value of property_key. */
    extents_json_url: string | null;
    /** The minimum zoom level that the map layer may be displayed at, for visualizations that support zooming. */
    max_zoom_level: number | null;
    /** The maximum zoom level that the map layer may be displayed at, for visualizations that support zooming. */
    min_zoom_level: number | null;
}
export interface RequestLookmlModelExploreFieldMapLayer {
}
