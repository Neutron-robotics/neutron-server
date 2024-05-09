export interface IElasticUserCreate {
    username: string
    password_hash: string
    email: string
    roles: string[]
}

export interface CreateConnectionDashboardParams {
    id?: string
    title: string,
    dataViewId: string,
    description?: string
}

export interface KibanaSavedObject<TAttribute> {
    id: string
    type: string
    namespaces: string[]
    updated_at: string
    created_at: string
    version: string
    attributes: TAttribute
}
