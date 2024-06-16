import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Collapser } from '@jupyterlab/ui-components';
import { ILauncher } from '@jupyterlab/launcher';
import { PageConfig } from '@jupyterlab/coreutils';
import { Panel, Widget } from '@lumino/widgets';

import { tagslist, required_metadata, optional_metadata } from './tags';
import { CheckboxButton, CheckboxButtonHolder } from './checkbox';
import '../style/index.css';



function escapeSpecialCharacters(str: string): string {
  const encoded = encodeURIComponent(str);
  const decoded = encoded
  .replace(/%2E/g, '.')  // Do not encode the dot character (.)
  .replace(/%2F/g, '/');  // Do not encode the slash character (/)

  return decoded;
}


function hash(item: string): string {
  let hash = 0;
  if (item.length == 0) return hash.toString();
  for (let i = 0; i < item.length; i++) {
    let char = item.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}


class metadataManagerWidget extends Widget {
  private inputFields: HTMLInputElement[] = [];
  private app: JupyterFrontEnd;
  private cwdhash: string;
  private settings: ISettingRegistry.ISettings;

  constructor(app: JupyterFrontEnd, cwd: string, settings: ISettingRegistry.ISettings) {
    super();
    this.id = "metadataManagerWidget";
    this.title.label = 'Metadata Manager';
    this.title.closable = true;
    this.addClass('metadata-manager-widget-container');
    this.app = app;
    this.cwdhash = hash(cwd);
    this.settings = settings;
  }

  // Set up the widget with the required items.
  setUp() {
    // Set height for the widget to the height of the window. Very bad fix but setting values in css doesn't work.
    this.node.style.height = window.innerHeight + 'px';

    // These are the important and required items, make a header for them to separate from the rest.
    const header = document.createElement('h2');
    header.textContent = 'Required Items:';
    this.node.appendChild(header);
    this.node.appendChild(document.createElement('br'));  // Line break to fill empty space in grid.

    const itemsToAdd = required_metadata;
    for (let item of itemsToAdd) {
      this.addItem(item);
    }

    // These are the optional items, make a header for them to separate from the rest.
    const optionalHeader = document.createElement('h2');
    optionalHeader.textContent = 'Optional Items:';
    this.node.appendChild(optionalHeader);
    this.node.appendChild(document.createElement('br'));

    const optionalItemsToAdd = optional_metadata;
    for (let item of optionalItemsToAdd) {
      this.addItem(item);
    }
    this.node.appendChild(document.createElement('br'));

    const button = document.createElement('button');
    button.textContent = 'Export Metadata';
    this.node.appendChild(button);

    button.addEventListener('click', async () => {
      // download the metadata as a json file.
      const metadata = await this.toROCrateJSON();
      const metadataString = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataString], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "ro-crate-metadata.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    // API Key field
    const API_Key_label = document.createElement('label');
    API_Key_label.textContent = 'API Key: ';
    this.node.appendChild(API_Key_label);

    const API_Key_input_field = document.createElement('input');
    API_Key_input_field.type = 'text';
    API_Key_input_field.placeholder = 'API Key';
    this.node.appendChild(API_Key_input_field);
    this.node.appendChild(document.createElement('br'));

    // Publish button, no behaviour for now.
    const publish_button = document.createElement('button');
    publish_button.textContent = 'Publish';
    this.node.appendChild(publish_button);
    this.node.appendChild(document.createElement('br'));

    // Create button that logs all files in the current directory.
    const log_button = document.createElement('button');
    log_button.textContent = 'Log Files';
    this.node.appendChild(log_button);

    var allfiles: any[] = [];

    log_button.addEventListener('click', async () => {
      allfiles = await this.getAllFiles("", []);
      console.log(allfiles);
    });
  }

  reset(): void {
    this.node.innerHTML = '';
    this.inputFields = [];
  }

  addItem(item: string): void {
    // Put the item name first
    const itemLabel = document.createElement('label');
    itemLabel.textContent = item + ' ';
    itemLabel.className = 'metadata-manager-widget-label';
    this.node.appendChild(itemLabel);

    // Add input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = item;
    inputField.name = item;
    inputField.className = 'metadata-manager-widget-input';

    // Load saved value
    const savedState = this.settings.get(this.cwdhash + '-' + item).composite as string;
    if (savedState !== null && savedState !== undefined) {
      inputField.value = savedState;
    }

    this.inputFields.push(inputField);
    this.node.appendChild(inputField);

    // Add a listener to the input field
    inputField.addEventListener('change', () => {
      this.settings.set(this.cwdhash + '-' + inputField.name, inputField.value);
    });
  }

  getInput(index: number): HTMLInputElement {
    return this.inputFields[index];
  }

  getItemsLength(): number {
    return this.inputFields.length;
  }

  getFromInputName(name: string): string {
    for (let input of this.inputFields) {
      if (input.name === name) {
        return input.value;
      }
    }
    return '';
  }

  async getAllFiles(currentpath: string, allFiles: any[]): Promise<any[]> {
    let filesList: any[] = [];
    const filebrowser = this.app.serviceManager.contents;
    const files = await filebrowser.get("./" + currentpath);
    for (let file of files.content) {
      filesList.push(file);
    }
    allFiles = allFiles.concat(filesList);
    for (let file of filesList) {
      if (file.type === "directory") {
        allFiles = await this.getAllFiles(currentpath + file.name + "/", allFiles);
      }
    }
    return allFiles;
  }

  async getAllFileNames(): Promise<string[]> {
    let fileNames: string[] = [];
    const filebrowser = this.app.serviceManager.contents;
    const files = await filebrowser.get("./");
    for (let file of files.content) {
      fileNames.push(file.name);
    }
    return fileNames;
  }

  async getAllFileContents(): Promise<string[]> {
    let fileContents: string[] = [];
    const filebrowser = this.app.serviceManager.contents;
    const files = await filebrowser.get("./");
    for (let file of files.content) {
      const filecontent = await filebrowser.get(file.path, { content: true });
      fileContents.push(filecontent.content);
    }
    return fileContents;
  }

  async getAllFileTypes(): Promise<string[]> {
    let fileTypes: string[] = [];
    const filebrowser = this.app.serviceManager.contents;
    const files = await filebrowser.get("./");
    for (let file of files.content) {
      fileTypes.push(file.type);
    }
    return fileTypes;
  }

  async toROCrateJSON(): Promise<any> {
    let obj: any = {};
    // Set up RO-Crate metadata
    obj["@context"] = "https://w3id.org/ro/crate/1.1/context";

    // Loop over the checkboxes and add them to an array
    var keywords = [];
    for (let tag of tagslist) {
      for (let tagname of tag.get_tags()) {
        const tagvar = this.cwdhash + tagname;
        let savedState = this.settings.get(tagvar).composite as boolean;
        if (savedState !== undefined && savedState !== null && savedState !== false) {
          keywords.push(tagname);
        }
      }
    }

    // File descriptor
    const filedescriptor = {
      "@type": "CreativeWork",
      "@id": "ro-crate-metadata.json",
      "conformsTo": {"@id": "https://w3id.org/ro/crate/1.1"},
      "about": {"@id": "./"},
      "keywords": keywords  // Keywords apply to all files, so put them here once instead of repeating over and over.
    };

    const allfiles = await this.getAllFiles("", []);
    const allfilepaths = allfiles.map((file: any) => file.path);

    // First, the root directory
    const root = {
      "@id": "./",
      "@type": "Dataset",
      "hasPart": allfilepaths.map((path: string) => {
        return {"@id": escapeSpecialCharacters(path)};
      })
    };

    // Then, all the folders
    var folders = [];
    for (let file of allfiles) {
      if (file.type === "directory") {
        const filesInFolder = await this.getAllFiles(file.path + "/", []);
        const filenamesInFolder = filesInFolder.map((file: any) => file.path);
        var folder;

        if (filesInFolder.length === 0) { // If the folder is empty, do not include hasPart.
          folder = {
            "@id": file.path + "/",
            "@type": "Dataset"
          };
        } else {
          folder = {
            "@id": file.path + "/",
            "@type": "Dataset",
            "hasPart": filenamesInFolder.map((path: string) => {
              return {"@id": escapeSpecialCharacters(path)};
            })
          };
        };
        folders.push(folder);
      }
    }

    // Collect general information
    const license = this.getFromInputName("license_url");
    const creator = this.getFromInputName("creator");
    const creator_firstname = creator.slice(0, creator.indexOf(" "));

    const creator_val = {
      "@id": "#" + (creator_firstname.length > 0 ? creator_firstname : "Unknown"),
      "@type": "Person",
      "name": creator.length > 0 ? creator : "Unknown"
    };

    // Finally, all the files
    var files = [];
    for (let file of allfiles) {
      if (file.type === "file") {
        const filecontent = await this.app.serviceManager.contents.get(file.path, { content: true });
        const fileinfo = {
          "@id": escapeSpecialCharacters(file.path),
          "@type": "File",
          "name": file.name,
          "contentSize": filecontent.content.length,
          "dateCreated": file.created,
          "dateModified": file.last_modified,
          "encodingFormat": file.mimetype,
          "license": {"@id": license},
          "author": {"@id": "#" + creator_firstname}
        };
        files.push(fileinfo);
      }
    }

    obj["@graph"] = [filedescriptor, root];
    obj["@graph"] = obj["@graph"].concat(folders);
    obj["@graph"] = obj["@graph"].concat(files);
    obj["@graph"] = obj["@graph"].concat([creator_val]);
    return obj;
  }
}


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
      console.error('No setting registry available for Metadata Manager extension, exiting.');
      return;
    }

    if (!launcher) {
      console.error('No launcher available for Metadata Manager extension, exiting.');
      return;
    }

    try {
      const settings = await settingRegistry.load(plugin.id);
      console.log('naavre-extension settings loaded:', settings.composite);

      const CWD = PageConfig.getOption('serverRoot');
      const CWDHash = hash(CWD);

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
          let savedState = settings.get(CWDHash + tagname).composite as boolean;
          if (savedState !== undefined) { // Load the saved state of the checkbox.
            newcheckbox.checkbox.checked = savedState;
          }

          newcheckbox.node.onclick = () => {  // Save the state of the checkbox.
            newcheckbox.checkbox.checked = !newcheckbox.checkbox.checked;
            settings.set(CWDHash + tagname, newcheckbox.checkbox.checked);
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
        label: 'Metadata Manager',
        execute: () => {
          const widget = new metadataManagerWidget(app, CWD, settings);
          widget.setUp();

          // Focus on the new window.
          app.shell.add(widget, 'main');
          app.shell.currentWidget?.close();
          app.shell.activateById(widget.id);
        }
      });

    } catch(reason) {
      console.error('Failed to load settings for naavre-extension.', reason);
    };
  }
};

export default plugin;
