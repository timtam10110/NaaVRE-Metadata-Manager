import { Widget } from '@lumino/widgets';

export class metadataManagerWidget extends Widget {
    constructor() {
      super();
      this.id = "naavre-test-widget";
      this.title.label = 'NaaVRE Test Widget';
      this.title.closable = true;
      this.addClass('naavre-test-widget');
      this.node.textContent = 'Test Widget';
    }
  }