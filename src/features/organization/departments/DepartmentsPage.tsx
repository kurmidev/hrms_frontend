import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, GitBranch, ChevronRight, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentsApi } from '@/api/departments.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { DepartmentTreeNode } from '@/types/organization.types'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function TreeNode({ node, depth, onEdit, onDelete }: { node: DepartmentTreeNode; depth: number; onEdit: (n: DepartmentTreeNode) => void; onDelete: (n: DepartmentTreeNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 group transition-colors',
          depth > 0 && 'ml-6'
        )}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn('text-muted-foreground transition-transform', !hasChildren && 'invisible', expanded && 'rotate-90')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <GitBranch className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
          {node.employeeCount !== undefined && node.employeeCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {node.employeeCount}
            </span>
          )}
          <Badge variant="outline" className="text-[10px] py-0 ml-auto hidden group-hover:flex">
            Level {node.hierarchyLevel}
          </Badge>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(node)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-border ml-9">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DepartmentsPage() {
  const qc = useQueryClient()
  const canView = usePermission('org:read')
  const [open, setOpen] = useState(false)
  const [editNode, setEditNode] = useState<DepartmentTreeNode | null>(null)
  const [deleteNode, setDeleteNode] = useState<DepartmentTreeNode | null>(null)
  const [search, setSearch] = useState('')

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: departmentsApi.tree,
    enabled: canView,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { reset({ name: '', parentId: '' }); setEditNode(null); setOpen(true) }
  const openEdit = (node: DepartmentTreeNode) => { reset({ name: node.name }); setEditNode(node); setOpen(true) }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      editNode
        ? departmentsApi.update(editNode.id, { name: data.name })
        : departmentsApi.create({ name: data.name, parentId: data.parentId || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments-tree'] })
      setOpen(false)
      toast.success(editNode ? 'Department updated.' : 'Department created.')
    },
    onError: () => toast.error('Failed to save department.'),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments-tree'] })
      setDeleteNode(null)
      toast.success('Department deleted.')
    },
    onError: () => toast.error('Cannot delete — it may have employees or sub-departments.'),
  })

  const filterTree = (nodes: DepartmentTreeNode[], q: string): DepartmentTreeNode[] => {
    if (!q) return nodes
    return nodes.flatMap((n) => {
      const childMatches = filterTree(n.children, q)
      if (n.name.toLowerCase().includes(q.toLowerCase()) || childMatches.length > 0) {
        return [{ ...n, children: childMatches }]
      }
      return []
    })
  }

  const filtered = filterTree(tree, search)

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Departments</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view departments.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Departments</h1>
            <p className="text-sm text-muted-foreground">Organizational hierarchy</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      <Input
        placeholder="Search departments…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm min-h-[300px]">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            {search ? 'No departments match your search.' : 'No departments yet. Add your first department.'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                onEdit={openEdit}
                onDelete={setDeleteNode}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editNode ? 'Edit Department' : 'New Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">Name *</Label>
              <Input id="dept-name" placeholder="e.g. Engineering" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            {!editNode && (
              <div className="space-y-1.5">
                <Label htmlFor="parentId">Parent Department (optional)</Label>
                <Input id="parentId" placeholder="Parent department ID" {...register('parentId')} />
                <p className="text-xs text-muted-foreground">Leave blank to create a root department</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editNode ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteNode}
        onOpenChange={(o) => !o && setDeleteNode(null)}
        title="Delete Department"
        description={`Delete "${deleteNode?.name}"? This will fail if it has employees or sub-departments.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteNode && del(deleteNode.id)}
        variant="destructive"
      />
    </div>
  )
}
