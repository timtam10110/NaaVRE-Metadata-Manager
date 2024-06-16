

class Tags {
    private category: string;
    private tags: string[];

    constructor(category: string, tags: string[]) {
        this.category = category;
        this.tags = tags;
    }

    get_category(): string {
        return this.category;
    }

    get_tags(): string[] {
        return this.tags;
    }

    add_tag(tag: string): void {
        this.tags.push(tag);
    }

    remove_tag(tag: string): void {
        this.tags = this.tags.filter(t => t !== tag);
    }

    clear_tags(): void {
        this.tags = [];
    }
}

var physicstags =  ["Black Holes", "Galaxies", "Stars", "Cosmology", "Earth and Planetary", "High Energy Astrophysical Phenomena", "Instrumentation and Methods",
                    "Solar and Stellar Astrophysics", "Disordered Systems", "Materials Science", "Mesoscale and Nanoscale Physics", "Soft Condensed Matter",
                    "Strongly Correlated Electrons", "Superconductivity", "Quantum Gases", "General Relativity and Quantum Cosmology", "Experiment", "Lattice",
                    "Phenomenology", "Theory", "Mathematical Physics", "Adaptation and Self-Organizing Systems", "Cellular Automata and Lattice Gases",
                    "Chaotic Dynamics", "Pattern Formation and Solitons", "Exactly Solvable and Integrable Systems", "Nuclear Theory", "Accelerator Physics",
                    "Applied Physics", "Atmospheric and Oceanic Physics", "Atomic and Molecular Clusters", "Atomic Physics", "Biological Physics", "Chemical Physics",
                    "Classical Physics", "Computational Physics", "Data Analysis, Statistics and Probability", "Fluid Dynamics", "General Physics", "Geophysics",
                    "Philosophy of Physics", "History of Physics", "Instrumentation and Detectors", "Medical Physics", "Optics", "Physics Education",
                    "Physics and Society", "Plasma Physics", "Popular Physics", "Space Physics", "Quantum Physics", "Statistical Mechanics", "Theoretical Physics"].sort();

var mathematicstags = ["Algebraic Geometry", "Algebraic Topology", "Analysis of PDEs", "Category Theory", "Classical Analysis and ODEs", "Combinatorics",
                    "Commutative Algebra", "Complex Variables", "Differential Geometry", "Dynamical Systems", "Functional Analysis", "General Mathematics",
                    "General Topology", "Geometric Topology", "Group Theory", "History and Overview", "Information Theory", "K-Theory and Homology", "Logic",
                    "Mathematical Physics", "Metric Geometry", "Number Theory", "Numerical Analysis", "Operator Algebras", "Optimization and Control", "Probability",
                    "Quantum Algebra", "Representation Theory", "Rings and Algebras", "Symplectic Geometry", "Statistics Theory"].sort();

var computerSciencetags = ["Artificial Intelligence", "Computation and Language", "Computational Complexity", "Computational Engineering", "Computational Geometry",
                    "Computer Science and Game Theory", "Computer Vision and Pattern Recognition", "Computers and Society", "Cryptography and Security",
                    "Data Structures and Algorithms", "Databases", "Digital Libraries", "Discrete Mathematics", "Distributed, Parallel, and Cluster Computing",
                    "Emerging Technologies", "Formal Languages and Automata Theory", "General Literature", "Graphics", "Hardware Architecture",
                    "Human-Computer Interaction", "Information Retrieval", "Information Theory", "Logic in Computer Science", "Machine Learning",
                    "Mathematical Software", "Multiagent Systems", "Multimedia", "Networking and Internet Architecture", "Neural and Evolutionary Computing",
                    "Numerical Analysis", "Operating Systems", "Other Computer Science", "Performance", "Programming Languages", "Robotics",
                    "Social and Information Networks", "Software Engineering", "Sound", "Symbolic Computation", "Systems and Control"].sort();

var biologytags = ["Biochemistry", "Bioinformatics", "Biomolecules", "Biophysics", "Cell Behavior", "Genomics", "Molecular Networks", "Neurons and Cognition",
                    "Other Biology", "Populations and Evolution", "Quantitative Methods", "Subcellular Processes", "Tissues and Organs"].sort();

var ecenomicstags = ["Computational Finance", "Economics", "Econometrics", "General Economics", "Mathematical Economics", "Microeconomics", "Portfolio Management",
                    "Pricing", "Quantitative Finance", "Risk Management", "Trading and Market Microstructure"].sort();

var statisticstags = ["Applications", "Computation", "Machine Learning", "Methodology", "Other Statistics", "Statistics Theory"].sort();

var electricalengineeringtags = ["Audio and Speech Processing", "Image and Video Processing", "Signal Processing", "Other Electrical Engineering", "Systems and Control"].sort();

var generaltags = ["Dataset", "Model", "Simulation", "Theory", "Experiment", "Review", "Other"].sort();

const Physics = new Tags("Physics", physicstags);
const Mathematics = new Tags("Mathematics", mathematicstags);
const ComputerScience = new Tags("Computer Science", computerSciencetags);
const Biology = new Tags("Biology", biologytags);
const Economics = new Tags("Economics", ecenomicstags);
const Statistics = new Tags("Statistics", statisticstags);
const ElectricalEngineering = new Tags("Electrical Engineering", electricalengineeringtags);
const General = new Tags("General", generaltags);

export const tagslist = [Physics, Mathematics, ComputerScience, Biology, Economics, Statistics, ElectricalEngineering, General];

export var required_metadata = [
    "title", "upload_type", "publication_type", "image_type", "creator", "description", "access_right", "license_id", "license_title", "license_url", "embargo_date"
]

export var optional_metadata = [
    "doi", "prereserve_doi", "notes", "related_identifiers", "contributors", "references", "communities", "version", "language", "method"
]

export class MetadataItems {
    // This will do something later, I promise :skull:
    private RequiredhtmlItems: HTMLElement[] = [];
    private requiredhtmlLabels: HTMLElement[] = [];
    private OptionalhtmlItems: HTMLElement[] = [];
    private optionalhtmlLabels: HTMLElement[] = [];

    constructor() {
        this.setup_required_items();
        this.setup_optional_items();
    }

    setup_required_items(): void {
        const l1 = "upload_type";
        const label1 = this.createLabel(l1);
        var options = ["publication", "poster", "presentation", "dataset", "image", "video", "software", "lesson", "physicalobject", "other"];
        const select1 = this.createDropdownMenu(l1, l1, options, true);
        this.requiredhtmlLabels.push(label1);
        this.RequiredhtmlItems.push(select1);

        const l2 = "publication_type";
        const label2 = this.createLabel(l2);
        options = ["annotationcollection", "book", "section", "conferencepaper", "datamanagementplan", "article", "patent", "preprint", "deliverable", "milestone",
                   "proposal", "report", "softwaredocumentation", "technicalnote", "thesis", "workingpaper", "other"];
        const select2 = this.createDropdownMenu(l2, l2, options, true);
        this.requiredhtmlLabels.push(label2);
        this.RequiredhtmlItems.push(select2);

        const l3 = "image_type";
        const label3 = this.createLabel(l3);
        options = ["figure", "plot", "drawing", "diagram", "photo", "other"];
        const select3 = this.createDropdownMenu(l3, l3, options, true);
        this.requiredhtmlLabels.push(label3);
        this.RequiredhtmlItems.push(select3);

        const l4 = "title";
        const label4 = this.createLabel(l4);
        const input4 = this.createInputMenu(l4, l4, "text", true);
        this.requiredhtmlLabels.push(label4);
        this.RequiredhtmlItems.push(input4);

        const l5 = "creators";
        const label5 = this.createLabel(l5);
        const input5 = this.createInputMenu(l5, l5, "text", true);
        // Add information on how to specify multiple creators (separate by ;)
        this.requiredhtmlLabels.push(label5);
        this.RequiredhtmlItems.push(input5);

        const l6 = "description";
        const label6 = this.createLabel(l6);
        const input6 = this.createInputMenu(l6, l6, "text", true);
        // Make larger through css
        this.requiredhtmlLabels.push(label6);
        this.RequiredhtmlItems.push(input6);

        const l7 = "access_right";
        const label7 = this.createLabel(l7);
        options = ["open", "embargoed", "restricted", "closed"];
        const select7 = this.createDropdownMenu(l7, l7, options, true);
        this.requiredhtmlLabels.push(label7);
        this.RequiredhtmlItems.push(select7);

        const l8 = "license";
        const label8 = this.createLabel(l8);
        const licenseid = this.createInputMenu("License id", "License id", "text", true);
        const licensetitle = this.createInputMenu("License title", "License title", "text", true);
        const licenseurl = this.createInputMenu("License url", "License url", "text", true);
        this.requiredhtmlLabels.push(label8);
        this.RequiredhtmlItems.push(licenseid);
        this.RequiredhtmlItems.push(licensetitle);
        this.RequiredhtmlItems.push(licenseurl);

        const l9 = "embargo_date";
        const label9 = this.createLabel(l9);
        const input9 = this.createInputMenu(l9, l9, "date", true);
        this.requiredhtmlLabels.push(label9);
        this.RequiredhtmlItems.push(input9);

        const l10 = "access_conditions";
        const label10 = this.createLabel(l10);
        const input10 = this.createInputMenu(l10, l10, "text", true);
        this.requiredhtmlLabels.push(label10);
        this.RequiredhtmlItems.push(input10);
        console.log("end of setup", this.RequiredhtmlItems.length, this.requiredhtmlLabels.length);
    }

    setup_optional_items(): void {
        const l1 = "doi";
        const label1 = this.createLabel(l1);
        const input1 = this.createInputMenu(l1, l1, "text", false);
        this.optionalhtmlLabels.push(label1);
        this.OptionalhtmlItems.push(input1);

        const l2 = "prereserve_doi";
        const label2 = this.createLabel(l2);
        const input2 = this.createDropdownMenu(l2, l2, ["yes", "no"], false);
        this.optionalhtmlLabels.push(label2);
        this.OptionalhtmlItems.push(input2);

        const l3 = "notes";
        const label3 = this.createLabel(l3);
        const input3 = this.createInputMenu(l3, l3, "text", false);
        this.optionalhtmlLabels.push(label3);
        this.OptionalhtmlItems.push(input3);

        const l4 = "contributors";
        const label4 = this.createLabel(l4);
        const input4 = this.createInputMenu(l4, l4, "text", false);
        this.optionalhtmlLabels.push(label4);
        this.OptionalhtmlItems.push(input4);

        const l5 = "references";
        const label5 = this.createLabel(l5);
        const input5 = this.createInputMenu(l5, l5, "text", false);
        this.optionalhtmlLabels.push(label5);
        this.OptionalhtmlItems.push(input5);

        const l6 = "communities";
        const label6 = this.createLabel(l6);
        const input6 = this.createInputMenu(l6, l6, "text", false);
        this.optionalhtmlLabels.push(label6);
        this.OptionalhtmlItems.push(input6);

        const l7 = "version";
        const label7 = this.createLabel(l7);
        const input7 = this.createInputMenu(l7, l7, "text", false);
        this.optionalhtmlLabels.push(label7);
        this.OptionalhtmlItems.push(input7);

        const l8 = "language";
        const label8 = this.createLabel(l8);
        const input8 = this.createInputMenu(l8, l8, "text", false);
        this.optionalhtmlLabels.push(label8);
        this.OptionalhtmlItems.push(input8);

        const l9 = "method";
        const label9 = this.createLabel(l9);
        const input9 = this.createInputMenu(l9, l9, "text", false);
        this.optionalhtmlLabels.push(label9);
        this.OptionalhtmlItems.push(input9);

        console.log("end of setup 2", this.OptionalhtmlItems.length, this.optionalhtmlLabels.length);
    }

    createDropdownMenu(id: string, name: string, options: string[], required: boolean): HTMLElement {
        const select = document.createElement('select');
        select.id = id;
        select.name = name;
        select.required = required;
        for (let item of options) {
            const option = document.createElement('option');
            option.value = item;
            option.text = item;
            select.appendChild(option);
        }
        return select;
    }

    createInputMenu(id: string, name: string, type: string, required: boolean): HTMLElement {
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.name = name;
        input.placeholder = name;
        input.required = required;
        return input;
    }

    createLabel(text: string): HTMLElement {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    getRequiredItems(): [HTMLElement[], HTMLElement[]] {
        console.log(this.RequiredhtmlItems.length, this.requiredhtmlLabels.length);
        return [this.RequiredhtmlItems, this.requiredhtmlLabels];
    }

    getOptionalItems(): [HTMLElement[], HTMLElement[]] {
        console.log(this.OptionalhtmlItems.length, this.optionalhtmlLabels.length);
        return [this.OptionalhtmlItems, this.optionalhtmlLabels];
    }
}