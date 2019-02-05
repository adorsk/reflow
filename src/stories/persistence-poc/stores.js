import ObservableMapStore from '../../engine/ObservableMapStore.js'

export const engineStore = new ObservableMapStore()
export const viewStore = new ObservableMapStore()

export default { engineStore, viewStore }
