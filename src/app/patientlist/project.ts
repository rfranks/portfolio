import { ProjectData } from "@/components/portfolio/ProjectPresentation";
import { createProjectPageData } from "@/components/portfolio/projectPageData";

export const projectData: ProjectData = createProjectPageData("/patientlist", {
  demoGifUrl: "/demogifs/patient_list_demo.gif",
  specifications: {
    facadeArchitecture: {
      purpose:
        "Stabilize UI contracts while allowing domain and DAO evolution.",
      modules: [
        "patient-list-war: Backbone/Handlebars UI, routers, views, templates, static assets.",
        "patient-list-rest: Spring Web controllers that only accept/return patient-list-api DTOs.",
        "patient-list-api: Facade interfaces and DTOs (VisitDto, VisitListDto, PagingDto, FilterDto).",
        "patient-list-services: Implements the Facade; mapping between DTOs and domain; validation; transactions; caching.",
        "patient-list-dao: Persistence repositories/queries; no API types leak upward.",
      ],
      callFlow:
        "UI (war) → REST controller (rest) ↔ DTOs (api) → Facade service (services) → Repository (dao) → DB.",
      mapping:
        "DTO↔Domain mapping occurs only inside patient-list-services via MapStruct or manual mappers.",
      evolution:
        "Additive DTO changes with versioned REST routes (/api/v1/*), deprecations flagged in Facade; UI remains stable.",
    },
    backboneVisitListFlow: {
      uiModelsAndCollections: {
        VisitModel:
          "Client-side model mirroring VisitDto fields used by the UI (id, mrn, name, admitTime, location, provider, status, flags).",
        VisitCollection: {
          url: "/api/v1/visits",
          parse:
            "Extracts array and paging metadata from {items:[], paging:{...}}.",
          behavior:
            "Supports query params for listId, search, filters, sort, page, pageSize.",
        },
        VisitListState:
          "Backbone.Model that stores route-bound state (listId, page, sort, filters); converts to query string with toQuery().",
      },
      views: {
        VisitListView:
          "Owns lifecycle and layout; listens to VisitCollection events 'request','sync','reset','error' to toggle spinner, render rows, show empty/error.",
        VisitItemView: "Renders a single visit row; rerenders on model change.",
        ToolbarView:
          "Search box, filter chips, bulk actions; emits 'filter:changed', 'search:typed', 'action:export'.",
        PaginationView:
          "Changes page → updates VisitListState → triggers fetch.",
        WizardView:
          "Multi-step builder/manager for patient lists; saves via /api/v1/visitLists and then routes to VisitList with the new listId.",
      },
      router: {
        VisitRouter:
          "Routes '#/visits?listId=123&page=1&sort=admitTime,desc&filters=...' to instantiate VisitListView with a VisitCollection and VisitListState seeded from the query.",
      },
      renderingPipeline:
        "VisitRouter → VisitListView.initialize() → collection.fetch({data: state.toQuery()}) → REST returns VisitDto[] + paging → collection.reset(items) → VisitListView.render() → for each model new VisitItemView({model}).render() → Handlebars templates produce the table.",
    },
    managementOfPatientListApp: {
      assets:
        "patient-list-war bundles Backbone modules, templates (.hbs), and pk-common-ui widgets; versioned static paths to enable long-lived caching with cache-busting.",
      security:
        "Spring Security in patient-list-rest validates JWT/session; per-list authorization enforced in Facade based on user/org/role.",
      reliability:
        "Controller timeouts, service-level retries for transient DB faults, idempotent job endpoints for PromptJob.",
      performance:
        "Server-side pagination/sort/filter, DAO query tuning (indexes, joins to avoid N+1), HTTP caching with ETag/If-None-Match, compressed assets.",
      telemetry:
        "UI emits audit events (route, filter change, export) to /audit; services log query timings; PromptJob publishes progress to a job-status endpoint.",
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
      name: "pk-common-ui (shared widgets/utilities)",
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
      name: "Java / Maven",
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
    "graph TD;\n  subgraph UI (patient-list-war)\n    Router[VisitRouter]\n    State[VisitListState]\n    Coll[VisitCollection]\n    ListView[VisitListView]\n    ItemView[VisitItemView]\n    Toolbar[ToolbarView]\n    Pager[PaginationView]\n    Wizard[WizardView]\n    TList[visit-list.hbs]\n    TRow[visit-row.hbs]\n  end\n  subgraph REST/API\n    EP[/GET /api/v1/visits/]\n    EPlist[/GET /api/v1/visitLists/{id}/visits/]\n    DTO[VisitDto]\n  end\n  subgraph Server\n    Ctl[VisitController]\n    Fac[VisitFacade]\n    Svc[VisitServiceImpl]\n    Map[VisitMapper]\n    Repo[VisitRepository]\n    DB[(DB)]\n  end\n  Router --> ListView\n  Router --> State\n  ListView --> Toolbar\n  ListView --> Pager\n  ListView --> Coll\n  Coll -->|reset/sync| ListView\n  ListView -->|each model| ItemView\n  ListView --> TList\n  ItemView --> TRow\n  Toolbar -->|filter:changed| State\n  Pager -->|page:changed| State\n  State -->|toQuery()| Coll\n  Coll -->|fetch| EP\n  EP --> Ctl --> Fac --> Svc --> Repo --> DB\n  Repo --> Svc --> Map --> DTO --> Ctl --> EP --> Coll\n  Wizard -->|save list| Ctl",
  sequenceDiagram:
    "sequenceDiagram\n  participant U as User\n  participant R as VisitRouter\n  participant V as VisitListView\n  participant S as VisitListState\n  participant C as VisitCollection\n  participant T as ToolbarView\n  participant H as Handlebars Templates\n  participant REST as /api/v1/visits\n  participant CTR as VisitController\n  participant FAC as VisitFacade(Service)\n  participant DAO as VisitRepository\n  participant DB as Database\n\n  U->>R: Navigate #/visits?listId=123&page=1\n  R->>S: create from query (listId,page,sort,filters)\n  R->>V: new VisitListView({state:S, collection:C})\n  V->>C: fetch({data: S.toQuery()})\n  C->>REST: GET /api/v1/visits?listId=123&page=1&sort=...\n  REST->>CTR: Dispatch controller\n  CTR->>FAC: findVisits(listId,paging,filters)\n  FAC->>DAO: query(listId,paging,filters)\n  DAO->>DB: Execute SQL\n  DB-->>DAO: rows\n  DAO-->>FAC: entities\n  FAC-->>CTR: List<VisitDto> + paging\n  CTR-->>C: 200 JSON {items:[], paging:{}}\n  C-->>V: reset/sync events\n  V->>H: Render visit-list.hbs + visit-row.hbs\n  H-->>V: HTML table\n  V-->>U: Patient visit list displayed\n  U->>T: Change filter/search\n  T-->>S: event filter:changed\n  S-->>V: change:*\n  V->>C: fetch() (debounced) with new query\n  C->>REST: GET /api/v1/visits?... (repeat)",
});
