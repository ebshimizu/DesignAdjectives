import { createStore } from '../backend/parameter-store';
import { CompositorBackend } from '../backend/compositor';

const compositorStore = createStore(CompositorBackend, 'compositor');

export default compositorStore;
