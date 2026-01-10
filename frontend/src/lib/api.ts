const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface Project {
    id: string;
    title: string;
    status: "Planning" | "In Progress" | "Review" | "Completed";
    start_date: string | null;
    print_deadline: string | null;
    created_at: string;
    updated_at?: string;
}

export async function getProjects(): Promise<Project[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/projects`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch projects", e);
        return [];
    }
}

export async function createProject(data: { title: string; start_date?: string }) {
    const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return await res.json();
}

export async function getProject(id: string): Promise<Project | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/projects/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch project", e);
        return null;
    }
}

// --- Sections ---

export interface Section {
    id: string;
    project_id: string;
    title: string;
    version: number;
    status: "Draft" | "Review" | "Locked";
    content_text: string;
    order_index: number;
}

export async function getSections(projectId: string): Promise<Section[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sections`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch sections", e);
        return [];
    }
}

export async function createSection(projectId: string, title: string): Promise<Section> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create section");
    return await res.json();
}

export async function getSection(sectionId: string): Promise<Section | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/sections/${sectionId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch section", e);
        return null;
    }
}

export async function updateSection(sectionId: string, content: string): Promise<Section> {
    const res = await fetch(`${API_BASE_URL}/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_text: content }),
    });
    if (!res.ok) throw new Error("Failed to update section");
    return await res.json();
}

export async function lockSection(sectionId: string): Promise<Section> {
    const res = await fetch(`${API_BASE_URL}/sections/${sectionId}/lock`, {
        method: "POST",
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail?.message || "Failed to lock section");
    }
    return await res.json();
}

export async function reviewSection(sectionId: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/sections/${sectionId}/review`, {
        method: "POST",
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to review section");
    }
    return await res.json();
}

// --- Archives ---

export interface Asset {
    id: string;
    project_id: string;
    type: "Photo" | "Poster" | "Menu" | "Audio" | "VerificationDoc";
    file_path: string;
    rights_status: "Unknown" | "Requested" | "Cleared" | "Restricted";
    credit_line: string | null;
    usage_scope: string;
}

export async function scanDirectory(projectId: string, directoryPath: string): Promise<Asset[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_path: directoryPath }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to scan directory");
    }
    return await res.json();
}

export async function getAssets(projectId: string): Promise<Asset[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/assets`);
    if (!res.ok) return [];
    return await res.json();
}

export async function updateAsset(assetId: string, data: { rights_status: string; credit_line?: string }): Promise<Asset> {
    const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update asset");
    return await res.json();
}

// --- Funding ---

export interface Opportunity {
    id: string;
    funder_name: string;
    programme_name: string;
    deadline: string;
    status: "To Review" | "Pursuing" | "Submitted" | "Rejected" | "Awarded";
    eligibility_criteria: Record<string, unknown>;
    budget_rules: Record<string, unknown>;
}

export interface ApplicationPackage {
    id: string;
    opportunity_id: string;
    narrative_draft: string | null;
    budget_json: Record<string, unknown> | null;
    submission_status: "Draft" | "Approved" | "Submitted";
    final_approval: boolean;
}

export async function createOpportunity(data: { funder_name: string; programme_name: string; deadline: string }): Promise<Opportunity> {
    const res = await fetch(`${API_BASE_URL}/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create opportunity");
    return await res.json();
}

export async function getOpportunities(): Promise<Opportunity[]> {
    const res = await fetch(`${API_BASE_URL}/opportunities`);
    if (!res.ok) return [];
    return await res.json();
}

export async function createApplication(opportunityId: string): Promise<ApplicationPackage> {
    const res = await fetch(`${API_BASE_URL}/applications?opportunity_id=${opportunityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to create application");
    return await res.json();
}

export async function updateApplication(appId: string, data: { narrative_draft?: string; budget_json?: Record<string, unknown>; submission_status?: string }): Promise<ApplicationPackage> {
    const res = await fetch(`${API_BASE_URL}/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update application");
    return await res.json();
}

// Dashboard Stats interface for typing
export interface DashboardStats {
    counts: {
        projects: number;
        opportunities: number;
        assets: number;
    };
    recent_projects: Project[];
    upcoming_deadlines: Opportunity[];
    recent_assets: Asset[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return await res.json();
}
