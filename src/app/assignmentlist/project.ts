import { ProjectData } from "@/components/showcase/ProjectPresentation";

export const projectData: ProjectData = {
  project: "patient-list-app AssignmentListView",
  description:
    "The patient-list-app is the operations console for the Configurable Patient Visit List. It lets users kick off background jobs that affect lists (refresh, recompute membership, export), observe job status, and open the Visit List UI directly with a given list context. It is not the renderer itself; instead, it drives/coordinates the Backbone VisitList screen by sending users to the route with the correct listId and by emitting audit and metrics events.",
  demoGifUrl: "/demogifs/assignment_list_demo.gif",
  specifications: {
    facadeArchitecture: {
      goal: "Stabilize contracts for UI while the domain/DAO layer evolves.",
      modules: [
        "patient-list-war: Backbone/Handlebars UI (AssignmentListView, VisitListView, routers, templates).",
        "patient-list-rest: Spring MVC controllers exposing versioned REST endpoints that accept/return patient-list-api DTOs only.",
        "patient-list-api: Facade interfaces + DTOs (AssignmentListDto, VisitDto, PagingDto, FilterDto).",
        "patient-list-services: Facade implementations, mapping between DTOs and domain entities, validation, transactions, caching.",
        "patient-list-dao: Repositories/queries; isolates persistence (SQL/ORM).",
      ],
      flow: "UI (war) → REST (rest) ↔ DTO (api) → Facade (services) → Repository (dao) → DB.",
      evolution:
        "Additive DTOs with /api/v1/* routes, deprecation windows, and mappers contained in services so UI is insulated.",
      security:
        "AuthN/Z enforced in patient-list-rest and re-checked inside Facade using user/org scope for list/assignment access.",
    },
    backboneAssignmentListFlow: {
      intent:
        "Render an Assignment List that nests/embeds a VisitList inside the AssignmentListView (e.g., by assignee/role/queue).",
      uiModelsAndCollections: {
        AssignmentModel:
          "Client model mirroring AssignmentListDto (id, name, criteria, owner, counts).",
        AssignmentCollection: {
          url: "/api/v1/assignmentLists",
          parse: "Returns array of AssignmentModel and paging.",
        },
        VisitModel: "Client model mirroring VisitDto for row rendering.",
        VisitCollection: {
          url: "/api/v1/visits",
          parse: "Extracts items[] and paging.",
          queryParams:
            "listId (assignment list), assigneeId/role, page, pageSize, sort, filters",
        },
        AssignmentState:
          "Backbone.Model storing route-bound state (assignmentListId, assignee, page, sort, filters) with toQuery().",
      },
      views: {
        AssignmentListView:
          "Container view that manages assignee tabs/queues and owns one VisitCollection per active context; listens to collection events to show spinners/empty/error and composes VisitListView as a subview.",
        VisitListView:
          "Subview that renders table rows for the currently selected assignee/segment using VisitCollection.",
        ToolbarView:
          "Shared toolbar for search, filters, bulk actions; emits 'filter:changed', 'action:*'.",
        PaginationView:
          "Controls page changes; updates AssignmentState and triggers fetch.",
        WizardView:
          "Multi-step builder for creating/editing assignment lists; on save, routes back to the AssignmentListView with new listId.",
      },
      router: {
        AssignmentRouter:
          "Routes '#/assignments/:id?assignee=RN1&page=1&sort=admitTime,desc&filters=...' to instantiate AssignmentListView with AssignmentState and VisitCollection seeded from query.",
      },
      renderingPipeline:
        "AssignmentRouter → AssignmentListView.initialize() → active VisitCollection.fetch({data: state.toQuery()}) → REST returns VisitDto[] + paging → collection.reset(items) → VisitListView.render() (row subviews) → Handlebars templates produce the table inside the AssignmentListView region.",
    },
    management: {
      assets:
        "patient-list-war bundles Backbone modules and Handlebars templates; cache-busted filenames. pk-common-ui provides shared widgets.",
      performance:
        "Server-side pagination/sort/filter, tuned DAO queries to avoid N+1, ETag/If-None-Match, gzip/brotli, client-side debounce on filter/search.",
      reliability:
        "Controller timeouts, service retries for transient DB faults, idempotent prompt job endpoints.",
      telemetry:
        "UI emits audit events (assignee switch, filter change, export) to /audit; services log timing and cache hit/miss.",
    },
  },
  technologiesUsed: [
    {
      name: "Backbone.js",
      url: "[https://backbonejs.org/](https://backbonejs.org/)",
    },
    {
      name: "Handlebars.js",
      url: "[https://handlebarsjs.com/](https://handlebarsjs.com/)",
    },
    {
      name: "pk-common-ui (shared UI utilities)",
      url: "[https://example.org/pk-common-ui](https://example.org/pk-common-ui)",
    },
    {
      name: "Spring Web MVC",
      url: "[https://spring.io/projects/spring-framework](https://spring.io/projects/spring-framework)",
    },
    {
      name: "Spring Boot",
      url: "[https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)",
    },
    {
      name: "Java / Maven (multi-module)",
      url: "[https://maven.apache.org/](https://maven.apache.org/)",
    },
    {
      name: "JUnit / Mockito",
      url: "[https://junit.org/](https://junit.org/)",
    },
    {
      name: "MapStruct (optional mappers)",
      url: "[https://mapstruct.org/](https://mapstruct.org/)",
    },
    {
      name: "Mermaid (diagrams)",
      url: "[https://mermaid.js.org/](https://mermaid.js.org/)",
    },
  ],
  blockDiagram:
    "graph TD;\n  WAR[patient-list-war\\\nBackbone/Handlebars UI] --> REST[patient-list-rest\\\nSpring Controllers];\n  REST --> API[patient-list-api\\\nFacade + DTOs];\n  API <--implements--> SRV[patient-list-services\\\nBusiness Logic, Mapping, Validation];\n  SRV --> DAO[patient-list-dao\\\nRepositories/Queries];\n  DAO --> DB[(Database)];\n  WAR -. static assets .-> ASSETS[Templates JS CSS];",
  componentDiagram:
    "graph TD;\n  subgraph UI patient-list-war\n    AR[AssignmentRouter]\n    AS[AssignmentState]\n    ALV[AssignmentListView]\n    VCOL[VisitCollection]\n    VLV[VisitListView]\n    TBV[ToolbarView]\n    PGR[PaginationView]\n    WIZ[WizardView]\n    TLIST[assignment-list.hbs]\n    TROW[visit-row.hbs]\n  end\n  subgraph REST/API\n    EPV[/GET /api/v1/visits/]\n    EPA[/GET /api/v1/assignmentLists/id/summary/]\n    DTOv[VisitDto]\n    DTOa[AssignmentListDto]\n  end\n  subgraph Server\n    CtlV[VisitController]\n    CtlA[AssignmentController]\n    Fac[PatientListFacade]\n    Svc[Facade Impl]\n    Map[DTO Mappers]\n    RepoV[VisitRepository]\n    RepoA[AssignmentRepository]\n    DB[(DB)]\n  end\n  AR --> AS\n  AR --> ALV\n  ALV --> TBV\n  ALV --> PGR\n  ALV --> VCOL\n  ALV -->|subview| VLV\n  VCOL -->|reset/sync| VLV\n  ALV --> TLIST\n  VLV --> TROW\n  TBV -->|filter:changed| AS\n  PGR -->|page:changed| AS\n  AS -->|toQuery| VCOL\n  VCOL -->|fetch| EPV\n  EPV --> CtlV --> Fac --> Svc --> RepoV --> DB\n  RepoV --> Svc --> Map --> DTOv --> CtlV --> EPV --> VCOL\n  ALV -->|load summary| EPA --> CtlA --> Fac --> RepoA --> DB\n  WIZ -->|save list| CtlA",
  sequenceDiagram:
    "sequenceDiagram\n  participant U as User\n  participant R as AssignmentRouter\n  participant S as AssignmentState\n  participant A as AssignmentListView\n  participant VC as VisitCollection\n  participant V as VisitListView\n  participant T as ToolbarView\n  participant REST as /api/v1/visits\n  participant CTR as VisitController\n  participant FAC as Facade(Service)\n  participant DAO as VisitRepository\n  participant DB as Database\n\n  U->>R: Navigate #/assignments/42?assignee=RN1&page=1\n  R->>S: Initialize state (listId=42, assignee=RN1, page=1, sort, filters)\n  R->>A: new AssignmentListView({state:S})\n  A->>VC: fetch({ data: S.toQuery() })\n  VC->>REST: GET /api/v1/visits?listId=42&assignee=RN1&page=1&sort=...\n  REST->>CTR: Dispatch\n  CTR->>FAC: findVisitsForAssignment(listId,assignee,paging,filters)\n  FAC->>DAO: query(listId,assignee,paging,filters)\n  DAO->>DB: Execute SQL\n  DB-->>DAO: rows\n  DAO-->>FAC: entities\n  FAC-->>CTR: List<VisitDto> + paging\n  CTR-->>VC: 200 {items:[], paging:{}}\n  VC-->>A: reset/sync events\n  A->>V: render subview with VC\n  V->>V: render rows using Handlebars (visit-row.hbs)\n  A-->>U: Assignment list with visits displayed\n  U->>T: Change filter/search/assignee\n  T-->>S: filter:changed / assignee:changed\n  S-->>A: change:*\n  A->>VC: fetch() (debounced) with new query\n  VC->>REST: GET /api/v1/visits?... (repeat)",
};
