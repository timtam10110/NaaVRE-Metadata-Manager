import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapser } from '@jupyterlab/ui-components';
import { ILauncher } from '@jupyterlab/launcher';
import { PageConfig } from '@jupyterlab/coreutils';
import { Panel } from '@lumino/widgets';

import { tagslist } from './tags';
import { CheckboxButton, CheckboxButtonHolder } from './checkbox';
import { metadataManagerWidget } from './meta_mgr';


/**
 * Initialization data for the metadata manager extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'naavre-extension:plugin',
  description: 'A NaaVRE extension for managing metadata',
  autoStart: true,
  optional: [ISettingRegistry, ILauncher],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null, launcher: ILauncher) => {

    if (!settingRegistry) {
      console.log('No setting registry available for Metadata Manager extension, exiting.');
      return;
    }

    try {
      const settings = await settingRegistry.load(plugin.id);
      console.log('naavre-extension settings loaded:', settings.composite);

      const CWD = PageConfig.getOption('serverRoot');

      // This is the panel in which the extension lives.
      const myPanel = new Panel();
      myPanel.id = "naavre-panel";

      // Load categories for tags..
      for (let tag of tagslist) {
        const div = document.createElement('div');
        div.textContent = tag.get_category();
        const newcollapse = new Collapser({
          widget: new CheckboxButtonHolder(), // Needed to track all checkboxes for a category.
          node: div,
          collapsed: true
        });
        newcollapse.id = tag.get_category() + '-collapse';
        myPanel.addWidget(newcollapse);

        // Load tags within the category.
        for (let tagname of tag.get_tags()) {
          const newcheckbox = new CheckboxButton(tagname);
          newcheckbox.id = tagname + '-checkbox-button';
          newcheckbox.hide();
          let savedState = settings.get(tagname).composite as boolean;
          if (savedState !== undefined) { // Load the saved state of the checkbox.
            newcheckbox.checkbox.checked = savedState;
          }

          newcheckbox.node.onclick = () => {  // Save the state of the checkbox.
            newcheckbox.checkbox.checked = !newcheckbox.checkbox.checked;
            settings.set(tagname, newcheckbox.checkbox.checked);
            console.log('Checkbox button clicked, checked:', tagname, newcheckbox.checkbox.checked);
          }
          myPanel.addWidget(newcheckbox);
          newcollapse.widget.addCheckbox(newcheckbox);
        }

        // Add a listener to the collapse button to hide/show the checkboxes.
        newcollapse.collapseChanged.connect((sender, collapsed) => {
          for (let box of newcollapse.widget.getCheckboxes()) {
            if (newcollapse.collapsed) {
              box.hide();
            } else {
              box.show();
            }
          }
        })
      };

      // Add the panel to the toolbar on the left.
      app.shell.add(myPanel, 'left', { rank: 1000 });

      // Add a launcher item
      const metadata_item: ILauncher.IItemOptions = {
        command: 'metadatamanager:open',
        category: 'Other',
        rank: 1000
      };
      launcher.add(metadata_item);

      const { commands } = app;
      commands.addCommand('metadatamanager:open', {
        label: 'Open metadata manager Widget',
        execute: () => {
          const widget = new metadataManagerWidget();
          app.shell.add(widget, 'main');
        }
      });

    } catch(reason) {
      console.error('Failed to load settings for naavre-extension.', reason);
    };
  }
};

export default plugin;
