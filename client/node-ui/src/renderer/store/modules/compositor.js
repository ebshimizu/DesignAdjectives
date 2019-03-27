import { createStore } from '../backend/parameter-store';
import { CompositorBackend } from '../backend/compositor';

const compositorStore = createStore(CompositorBackend);

export default compositorStore;
