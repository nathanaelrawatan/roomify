const PROJECT_PREFIX = 'roomify_project_'

const jsonError = (status, message, data = {}) => {
  return new Response(JSON.stringify({ status, message, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    } catch {
        return null;
    }
}

router.get("/api/projects/list", async ({ user }) => {
  try {
    const userPuter = user.puter;

    if (!userPuter) {
      return jsonError(401, "Unauthorized");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Unauthorized");
    }

    const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
        .map(({value}) => ({ ...value, isPublic: true}));


    return {projects}
  } catch (e) {
    return jsonError(500, "Failed to list projects", {
      error: e?.message || "Unknown Error",
    });
  }
});

router.get("/api/projects/get", async ({ request, user }) => {
  try {
    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(401, "Unauthorized");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Unauthorized");
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return jsonError(400, "Missing id");
    }

    const key = `${PROJECT_PREFIX}${id}`;
    const project = await userPuter.kv.get(key);

    if (!project) {
      return jsonError(404, "Project not found", { id });
    }

    return { project };
  } catch (e) {
    return jsonError(500, "Failed to get project", {
      error: e?.message || "Unknown Error",
    });
  }
});

router.post('/api/projects/save', async ({request, user}) => {
    try {
        const userPuter = user.puter;

        if (!userPuter) {
            return jsonError(401, 'Unauthorized')
        }

        const body = await request.json();
        const project = body?.project;

        if (!project?.id || !project?.sourceImage) {
            return jsonError(400, 'Project ID and source image are required')
        }

        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);

        if (!userId) {
            return jsonError(401, 'Unauthorized')
        }

        const key = `${PROJECT_PREFIX}${project.id}`;

        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload}
    } catch (e) {
        return jsonError(500, 'Failed to save project', {e: e.message || 'Unknown Error'})
    }
})

