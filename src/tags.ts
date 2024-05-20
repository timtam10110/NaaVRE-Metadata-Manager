

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