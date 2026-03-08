import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 50;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { orgId: session.user.orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where: { orgId: session.user.orgId } }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
